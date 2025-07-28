interface GoogleOAuthConfig {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  REFRESH_TOKEN: string;
  TOKEN_URL: string;
}

class GoogleSheetsService {
  private config: GoogleOAuthConfig = {
    CLIENT_ID: "416630995185-g7b0fm679lb4p45p5lou070cqscaalaf.apps.googleusercontent.com",
    CLIENT_SECRET: "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",
    REFRESH_TOKEN: "1//0gT2uoYBlNdGXCgYIARAAGBASNwF-L9IrBK_ijYwpce6-TdqDfji4GxYuc4uxIBKasdgoZBPm-tu_EU0xS34cNirqfLgXbJ8_NMk",
    TOKEN_URL: "https://oauth2.googleapis.com/token"
  };

  private spreadsheetId = "1rGMDDvvTbZfNg1dueWtRN3LhOgGQOdLg3Fd7Sn1GCZo";
  private sheetName = "Expirations";
  private annotationsSheetName = "Member_Annotations";

  async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(this.config.TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.CLIENT_ID,
          client_secret: this.config.CLIENT_SECRET,
          refresh_token: this.config.REFRESH_TOKEN,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async fetchSheetData(): Promise<any[][]> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.sheetName}!A:P`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sheet data');
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
  }

  async fetchAnnotations(): Promise<any[][]> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.annotationsSheetName}!A:F`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        // If sheet doesn't exist, create it
        await this.createAnnotationsSheet();
        return [['Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Last Updated']];
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching annotations:', error);
      return [['Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Last Updated']];
    }
  }

  async createAnnotationsSheet(): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [{
              addSheet: {
                properties: {
                  title: this.annotationsSheetName
                }
              }
            }]
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create annotations sheet');
      }

      // Add headers
      await this.updateAnnotations([
        ['Member ID', 'Email', 'Comments', 'Notes', 'Tags', 'Last Updated']
      ]);
    } catch (error) {
      console.error('Error creating annotations sheet:', error);
    }
  }

  async updateAnnotations(values: any[][]): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      const range = `${this.annotationsSheetName}!A:F`;
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update annotations');
      }
    } catch (error) {
      console.error('Error updating annotations:', error);
      throw error;
    }
  }

  async saveAnnotation(memberId: string, email: string, comments: string, notes: string, tags: string[]): Promise<void> {
    try {
      const annotationsData = await this.fetchAnnotations();
      const existingIndex = annotationsData.findIndex(row => row[0] === memberId);
      const timestamp = new Date().toISOString();
      const tagsString = tags.join(', ');
      
      const newRow = [memberId, email, comments, notes, tagsString, timestamp];
      
      if (existingIndex >= 0) {
        // Update existing row
        annotationsData[existingIndex] = newRow;
      } else {
        // Add new row
        annotationsData.push(newRow);
      }
      
      await this.updateAnnotations(annotationsData);
    } catch (error) {
      console.error('Error saving annotation:', error);
      throw error;
    }
  }

  async getMembershipData() {
    try {
      const [rawData, annotationsData] = await Promise.all([
        this.fetchSheetData(),
        this.fetchAnnotations()
      ]);
      
      if (rawData.length === 0) return [];

      // Skip header row and transform data
      const [headers, ...rows] = rawData;
      const [annotationHeaders, ...annotationRows] = annotationsData;
      
      // Create a map of annotations by member ID
      const annotationsMap = new Map();
      annotationRows.forEach(row => {
        if (row[0]) { // if member ID exists
          annotationsMap.set(row[0], {
            comments: row[2] || '',
            notes: row[3] || '',
            tags: row[4] ? row[4].split(', ').filter(tag => tag.trim()) : []
          });
        }
      });
      
      return rows.map(row => {
        const memberId = row[1] || '';
        const annotations = annotationsMap.get(memberId) || { comments: '', notes: '', tags: [] };
        
        return {
          uniqueId: row[0] || '',
          memberId: memberId,
          firstName: row[2] || '',
          lastName: row[3] || '',
          email: row[4] || '',
          membershipName: row[5] || '',
          endDate: row[6] || '',
          location: row[7] || '',
          sessionsLeft: parseInt(row[8]) || 0,
          itemId: row[9] || '',
          orderDate: row[10] || '',
          soldBy: row[11] || '',
          membershipId: row[12] || '',
          frozen: row[13] || '',
          paid: row[14] || '',
          status: row[15] as 'Active' | 'Expired' || 'Expired',
          comments: annotations.comments,
          notes: annotations.notes,
          tags: annotations.tags
        };
      });
    } catch (error) {
      console.error('Error processing membership data:', error);
      // Return mock data for development
      return this.getMockData();
    }
  }

  private getMockData() {
    return [
      {
        uniqueId: "4406-Studio 4 Class Package-19981880-2022-02-27T18:30:00.000Z",
        memberId: "4406",
        firstName: "Shereena",
        lastName: "Master",
        email: "shereena.master@gmail.com",
        membershipName: "Studio 4 Class Package",
        endDate: "11/02/2023 00:00:00",
        location: "Kwality House, Kemps Corner",
        sessionsLeft: 0,
        itemId: "19981880",
        orderDate: "2022-02-28 00:00:00",
        soldBy: "-",
        membershipId: "25768",
        frozen: "-",
        paid: "4779",
        status: "Expired" as const,
        comments: "",
        notes: "",
        tags: []
      },
      {
        uniqueId: "77316-Studio Annual Unlimited---2026-01-01T00:12:39.000Z",
        memberId: "77316",
        firstName: "Ayesha",
        lastName: "Mansukhani",
        email: "ayesha.mansukhani@gmail.com",
        membershipName: "Studio Annual Unlimited",
        endDate: "01/01/2026 05:42:39",
        location: "Kwality House, Kemps Corner",
        sessionsLeft: 0,
        itemId: "-",
        orderDate: "2026-01-01 05:42:39",
        soldBy: "-",
        membershipId: "-",
        frozen: "FALSE",
        paid: "-",
        status: "Active" as const,
        comments: "",
        notes: "",
        tags: []
      },
      {
        uniqueId: "110567-Studio 4 Class Package-39727200-2025-04-12T13:27:43.839Z",
        memberId: "110567",
        firstName: "Swathi",
        lastName: "Mohan",
        email: "swathimohan05@gmail.com",
        membershipName: "Studio 4 Class Package",
        endDate: "25/04/2025 19:30:00",
        location: "Supreme HQ, Bandra",
        sessionsLeft: 3,
        itemId: "39727200",
        orderDate: "2025-04-12 18:57:43",
        soldBy: "imran@physique57mumbai.com",
        membershipId: "25768",
        frozen: "-",
        paid: "6313",
        status: "Expired" as const,
        comments: "",
        notes: "",
        tags: []
      }
    ];
  }
}

export const googleSheetsService = new GoogleSheetsService();
