const csv = require("csv-parser")
const xlsx = require("xlsx")
const fs = require("fs")
const path = require("path")

/**
 * Parse a CSV file and return the data as an array of objects
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} - Array of objects representing the CSV data
 */
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error))
  })
}

/**
 * Parse an Excel file and return the data as an array of objects
 * @param {string} filePath - Path to the Excel file
 * @returns {Array} - Array of objects representing the Excel data
 */
function parseExcel(filePath) {
  const workbook = xlsx.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  return xlsx.utils.sheet_to_json(worksheet)
}

/**
 * Process a file based on its extension
 * @param {string} filePath - Path to the file
 * @returns {Promise<Array>} - Array of objects representing the file data
 */
async function processFile(filePath) {
  const fileExtension = path.extname(filePath).toLowerCase()

  if (fileExtension === ".csv") {
    return await parseCSV(filePath)
  } else if (fileExtension === ".xlsx" || fileExtension === ".xls") {
    return parseExcel(filePath)
  } else {
    throw new Error("Unsupported file format. Only CSV, XLS, and XLSX are supported.")
  }
}

/**
 * Validate contact data
 * @param {Array} contacts - Array of contact objects
 * @returns {Object} - Object containing valid contacts and validation errors
 */
function validateContacts(contacts) {
  const validContacts = []
  const errors = []

  contacts.forEach((contact, index) => {
    const rowNumber = index + 2 // +2 because of 0-indexing and header row
    const error = { row: rowNumber, errors: [] }

    // Check required fields
    if (!contact.FirstName) {
      error.errors.push("FirstName is required")
    }

    if (!contact.Phone) {
      error.errors.push("Phone is required")
    }

    // If there are errors, add to errors array
    if (error.errors.length > 0) {
      errors.push(error)
    } else {
      // Add valid contact
      validContacts.push({
        firstName: contact.FirstName,
        phone: contact.Phone,
        notes: contact.Notes || "",
      })
    }
  })

  return { validContacts, errors }
}

module.exports = {
  parseCSV,
  parseExcel,
  processFile,
  validateContacts,
}
