import csv from "csv-parser";
import fs from "fs";
import xlsx from "xlsx";
import Agent from "../models/Agent.js";
import List from "../models/List.js";
import path from "path";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

export const getLists = async (req, res) => {
  try {
    console.log('Fetching lists for user:', req.user._id);
    
    const lists = await List.find()
      .populate('agentId', 'name email')
      .lean()
      .exec();
    
    if (!lists) {
      console.log('No lists found');
      return res.json([]);
    }

    // Log the first list's data for debugging
    if (lists.length > 0) {
      console.log('Sample list data:', {
        agentId: lists[0].agentId,
        dataCount: lists[0].data.length,
        sampleRecord: lists[0].data[0]
      });
    }

    console.log(`Found ${lists.length} lists with data:`, 
      lists.map(list => ({
        agent: list.agentId?.name,
        records: list.data.length
      }))
    );

    // Normalize list data fields to guarantee frontend receives { firstName, phone, notes }
    const normalized = lists.map(list => ({
      _id: list._id,
      agentId: list.agentId,
      data: Array.isArray(list.data) ? list.data.map(item => ({
        firstName: item.firstName || item.FirstName || item.firstname || item['First Name'] || '',
        phone: item.phone || item.Phone || item.phoneNumber || item.PhoneNumber || item.contact || item.Mobile || item.mobile || '',
        notes: item.notes || item.Notes || item.description || item.Description || ''
      })) : []
    }));

    res.json(normalized);
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ 
      message: "Error fetching lists",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const validateFileType = (filename) => {
  if (!filename) {
    throw new Error('No filename provided');
  }
 
  const ext = filename.toLowerCase().split('.').pop();
  const allowedExtensions = ['csv', 'xlsx', 'xls'];
  
  if (!ext) {
    throw new Error('File has no extension');
  }
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`Invalid file type: ${ext}. Only ${allowedExtensions.join(', ')} files are allowed.`);
  }

  return ext;
};

const validateCSVFormat = (records) => {
  if (!Array.isArray(records)) {
    throw new Error('Invalid data format: expected an array of records');
  }

  if (records.length === 0) {
    throw new Error('The file is empty. Please upload a file with data.');
  }

  const firstRecord = records[0];
  if (!firstRecord || typeof firstRecord !== 'object') {
    throw new Error('Invalid record format: expected an object with properties');
  }
  const possibleFirstNameColumns = ['FirstName', 'firstname', 'first_name', 'Name', 'name'];
  const possiblePhoneColumns = ['Phone', 'phone', 'contact', 'mobile', 'Mobile', 'PhoneNumber'];
  const recordColumns = Object.keys(firstRecord).map(key => key.toLowerCase());
   
  const foundNameColumn = Object.keys(firstRecord).find(key => 
    possibleFirstNameColumns.map(col => col.toLowerCase()).includes(key.toLowerCase())
  );
  
  const foundPhoneColumn = Object.keys(firstRecord).find(key => 
    possiblePhoneColumns.map(col => col.toLowerCase()).includes(key.toLowerCase())
  );

  if (!foundNameColumn || !foundPhoneColumn) {
    throw new Error(
      'Missing required columns. File must contain:\n' +
      `- A name column (one of: ${possibleFirstNameColumns.join(', ')})\n` +
      `- A phone column (one of: ${possiblePhoneColumns.join(', ')})\n` +
      `Found columns: ${Object.keys(firstRecord).join(', ')}`
    );
  }

  // Validate data in each row
  const invalidRows = [];
  records.forEach((record, index) => {
    if (!record[foundNameColumn] || !record[foundPhoneColumn]) {
      invalidRows.push(index + 1);
    }
  });

  if (invalidRows.length > 0) {
    const rowWord = invalidRows.length === 1 ? 'row' : 'rows';
    throw new Error(
      `Found ${invalidRows.length} invalid ${rowWord} missing required data.\n` +
      `Check ${rowWord}: ${invalidRows.join(', ')}`
    );
  }

  return {
    nameColumn: foundNameColumn,
    phoneColumn: foundPhoneColumn
  };
};

export const uploadList = async (req, res) => {
  let file;
  try {
    console.log('Upload request received');
    
    // Check if file exists
    if (!req.file) {
      console.log('No file found in request');
      return res.status(400).json({ 
        message: "No file uploaded",
        status: "error" 
      });
    }

    file = req.file;
    console.log('File received:', file.originalname);

    // Validate file type and get extension
    const ext = file.originalname.toLowerCase().split('.').pop();
    try {
      validateFileType(file.originalname);
    } catch (error) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ 
        message: error.message,
        status: "error"
      });
    }

    let records = [];

    // Log file information
    console.log('Processing file:', {
      filename: file.originalname,
      size: file.size,
      path: file.path,
      extension: ext
    });
    
    if (ext === "csv") {
      try {
        records = await new Promise((resolve, reject) => {
          const results = [];
          let stream;
          try {
             
            stream = fs.createReadStream(file.path, { encoding: 'utf-8' })
              .pipe(csv({
                mapHeaders: ({ header }) => header ? header.trim().toLowerCase() : header,
                mapValues: ({ header, index, value }) => (typeof value === 'string' ? value.trim() : value),
                skipLines: 0
              }));
 
            stream.on("data", (row) => {
              results.push(row);
            });

            stream.on("end", () => {
              resolve(results);
            });

            stream.on("error", (error) => {
              console.error('CSV stream error:', error);
              reject(error);
            });

          } catch (streamError) {
            console.error('Stream setup error:', streamError);
            if (stream) {
              stream.destroy();
            }
            reject(streamError);
          }
        });
        if (!records || records.length === 0) {
          throw new Error('The file appears to be empty');
        }
        console.log('First raw normalized record:', records[0]);
        records = records.map((row, index) => {
          const firstName = row.firstname || row['first name'] || row.name || '';
          const phone = row.phone || row.phonenumber || row['phone number'] || row.contact || row.mobile || '';
          const notes = row.notes || row.description || '';

          const mapped = { firstName, phone, notes };
          console.log(`Mapped row ${index}:`, mapped);
          return mapped;
        });

        console.log('First mapped record:', records[0]);
        console.log('Total records mapped:', records.length);

      } catch (error) {
        // Clean up file if it exists
        try {
          if (file && file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (cleanupError) {
          console.error('Failed to clean up file after CSV error:', cleanupError);
        }

        throw new Error(`CSV validation failed: ${error.message}`);
      }
    } else {
      try {
        // Read Excel file
        const workbook = xlsx.readFile(file.path);
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Excel file is empty or corrupted');
        }

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRecords = xlsx.utils.sheet_to_json(sheet);

        if (!rawRecords || rawRecords.length === 0) {
          throw new Error('Excel file contains no data');
        }

        // Clean and validate Excel data
        records = rawRecords.map((row, index) => {
          const cleanRow = {
            FirstName: row.FirstName || row.firstname || row['First Name'] || '',
            Phone: row.Phone || row.phone || row.contact || '',
            Notes: row.Notes || row.notes || ''
          };

          if (!cleanRow.FirstName || !cleanRow.Phone) {
            throw new Error(`Row ${index + 2} is missing required FirstName or Phone data`);
          }

          return cleanRow;
        });
      } catch (xlsxError) {
        throw new Error(`Excel validation failed: ${xlsxError.message}`);
      }
    }

    if (records.length === 0) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ message: "The file is empty" });
    }
    console.log('First record structure:', records[0]);
    if (!records || records.length === 0) {
      fs.unlinkSync(file.path);
      return res.status(400).json({
        message: "No records found in the file",
        details: "The file appears to be empty or not properly formatted"
      });
    }

    const firstRecord = records[0];
    console.log('Available columns in file:', Object.keys(firstRecord));
    const possibleFirstNameColumns = ['FirstName', 'firstname', 'first_name', 'Name', 'name'];
    const possiblePhoneColumns = ['Phone', 'phone', 'contact', 'mobile', 'Mobile', 'PhoneNumber']; 
    const recordKeys = Object.keys(firstRecord).map(key => key.toLowerCase());
    console.log('Lowercase record keys:', recordKeys);

    // Find matching columns (case-insensitive)
    const foundFirstNameColumn = Object.keys(firstRecord).find(key => 
      possibleFirstNameColumns.map(col => col.toLowerCase()).includes(key.toLowerCase())
    );
    const foundPhoneColumn = Object.keys(firstRecord).find(key => 
      possiblePhoneColumns.map(col => col.toLowerCase()).includes(key.toLowerCase())
    );

    console.log('Found name column:', foundFirstNameColumn);
    console.log('Found phone column:', foundPhoneColumn);

    if (!foundFirstNameColumn || !foundPhoneColumn) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ 
        message: "Invalid file structure. Required columns not found.",
        details: `File must contain a name column (${possibleFirstNameColumns.join(' or ')}) and a phone column (${possiblePhoneColumns.join(' or ')})`,
        foundColumns: Object.keys(firstRecord),
        expectedNameColumns: possibleFirstNameColumns,
        expectedPhoneColumns: possiblePhoneColumns,
        actualColumns: recordKeys
      });
    }

    const transformedRecords = records.map(record => {
      if (record.firstName || record.phone || record.notes) {
        return {
          firstName: record.firstName || record.FirstName || record.firstname || record['First Name'] || '',
          phone: record.phone || record.Phone || record.phoneNumber || record.PhoneNumber || record.contact || record.Mobile || record.mobile || '',
          notes: record.notes || record.Notes || record.description || record.Description || ''
        };
      }
      const detectedFirst = record[foundFirstNameColumn] || record.FirstName || record.firstname || record['First Name'] || record.Name || '';
      const detectedPhone = record[foundPhoneColumn] || record.Phone || record.phone || record.contact || record.PhoneNumber || '';
      const notesKey = Object.keys(record).find(key => ['Notes', 'notes', 'description', 'Description'].map(n => n.toLowerCase()).includes(key.toLowerCase()));

      const transformed = {
        firstName: detectedFirst,
        phone: detectedPhone,
        notes: notesKey ? record[notesKey] : ''
      };

      console.log('Transformed record:', transformed);
      return transformed;
    });

    console.log('Transformed first record:', transformedRecords[0]);

    await distribute(transformedRecords, req, res);
  } catch (error) {
    console.error('Upload error:', {
      message: error.message,
      stack: error.stack,
      file: file ? {
        name: file.originalname,
        path: file.path,
        size: file.size
      } : 'No file info'
    });

    // Clean up file if it exists
    try {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log('Cleaned up file:', file.path);
      }
    } catch (cleanupError) {
      console.error('Failed to clean up file:', cleanupError);
    }

    // Send appropriate error response
    const statusCode = error.status || 500;
    res.status(statusCode).json({ 
      message: error.message || "Failed to process file", 
      details: process.env.NODE_ENV === 'development' ? {
        error: error.message,
        stack: error.stack
      } : undefined,
      status: "error"
    });
  }
};

const distribute = async (records, req, res) => {
  try {
    console.log('Starting distribution process...');
    
    const agents = await Agent.find();
    console.log(`Found ${agents.length} agents:`, agents.map(a => `${a.name} (${a.email})`));
    
    if (agents.length === 0) {
      return res.status(400).json({ message: "No agents found to distribute the data" });
    }

    console.log(`Distribution started for ${records.length} records among ${agents.length} agents`);
    console.log('Sample record to distribute:', records[0]);

    // Delete existing distributions
    try {
      await List.deleteMany({});
      console.log('Cleared previous distributions');
    } catch (deleteError) {
      console.error('Error clearing previous distributions:', deleteError);
      throw new Error('Failed to clear previous distributions');
    }

    const chunkSize = Math.ceil(records.length / agents.length);
    console.log(`Each agent will receive approximately ${chunkSize} records`);
    
    const distributions = [];

    for (let i = 0; i < agents.length; i++) {
      const chunk = records.slice(i * chunkSize, (i + 1) * chunkSize);
      if (chunk.length > 0) {
        // Log the chunk for this agent
        console.log(`Agent ${agents[i].name} chunk:`, chunk);
        
        distributions.push({
          agentId: agents[i]._id,
          data: chunk.map(record => ({
            firstName: record.firstName,
            phone: record.phone,
            notes: record.notes
          }))
        });
        console.log(`Prepared ${chunk.length} records for agent ${agents[i].name}`);
      }
    }

    try {
      const result = await List.insertMany(distributions);
      console.log(`Successfully created ${result.length} distributions`);
    } catch (insertError) {
      console.error('Error inserting distributions:', insertError);
      throw new Error('Failed to save distributions to database');
    }

    // Clean up the uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('Cleaned up uploaded file');
    }

    res.json({ 
      message: "Data distributed successfully",
      summary: {
        totalRecords: records.length,
        agentsCount: agents.length,
        recordsPerAgent: chunkSize,
        distributionsCreated: distributions.length
      }
    });
  } catch (error) {
    console.error('Distribution error:', error);
    res.status(500).json({ 
      message: "Failed to distribute data",
      error: error.message
    });
  }
};
