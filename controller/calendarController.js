const fs = require('fs');
const path = require('path');

const formatYyyyMmDdToDdMmYyyy = (value) => {
  if (!value || !/^[0-9]{8}$/.test(String(value))) return null;
  const yyyy = value.slice(0, 4);
  const mm = value.slice(4, 6);
  const dd = value.slice(6, 8);
  return `${dd}-${mm}-${yyyy}`;
};

// GET /api/default-city-calendar-range
// Public endpoint (no api_key required).
// Returns overall date range (min start_date, max end_date)
// from users-data/0000000001_0000000002_modified/calendar_0000000001_0000000002(.txt)
const getDefaultCityCalendarRange = async (req, res) => {
  try {
    // Per requirement: always use the shared default-city dataset folder/file.
    const defaultCityIdA = '0000000001';
    const defaultCityIdB = '0000000002';

    let usersDataDir = String(process.env.USERS_DATA_DIR || 'users-data').trim();
    if (!path.isAbsolute(usersDataDir)) {
      usersDataDir = path.join(process.cwd(), usersDataDir);
    }

    const modifiedFolder = `${defaultCityIdA}_${defaultCityIdB}_modified`;
    // Allow USERS_DATA_DIR to be set directly to the modified folder path.
    // If so, don't append the modified folder name again.
    const resolvedBaseDir = path.basename(usersDataDir) === modifiedFolder
      ? usersDataDir
      : path.join(usersDataDir, modifiedFolder);
    const calendarFileBaseName = `calendar_${defaultCityIdA}_${defaultCityIdB}`;

    const calendarFilePathTxt = path.join(resolvedBaseDir, `${calendarFileBaseName}.txt`);
    const calendarFilePathNoExt = path.join(resolvedBaseDir, calendarFileBaseName);

    const calendarFilePath = fs.existsSync(calendarFilePathTxt)
      ? calendarFilePathTxt
      : (fs.existsSync(calendarFilePathNoExt) ? calendarFilePathNoExt : null);

    if (!calendarFilePath) {
      return res.status(404).json({
        success: false,
        code: 404,
        data: {
          min_start_date: null,
          max_end_date: null
        },
        message: 'Default city calendar file not found'
      });
    }

    const content = fs.readFileSync(calendarFilePath, 'utf8');
    const lines = content.split(/\r?\n/).filter((line) => String(line).trim().length > 0);

    if (lines.length < 2) {
      return res.status(200).json({
        success: false,
        code: 200,
        data: {
          min_start_date: null,
          max_end_date: null
        },
        message: 'Default city calendar file contains no data rows'
      });
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const startIdx = headers.indexOf('start_date');
    const endIdx = headers.indexOf('end_date');

    if (startIdx < 0 || endIdx < 0) {
      return res.status(500).json({
        success: false,
        code: 500,
        data: null,
        message: 'Default city calendar file is missing required columns start_date/end_date'
      });
    }

    let rawMinStart = null;
    let rawMaxEnd = null;

    for (const line of lines.slice(1)) {
      const values = line.split(',').map((v) => v.trim());
      const startVal = values[startIdx] ?? '';
      const endVal = values[endIdx] ?? '';

      if (!/^[0-9]{8}$/.test(startVal) || !/^[0-9]{8}$/.test(endVal)) {
        continue;
      }

      if (!rawMinStart || startVal < rawMinStart) rawMinStart = startVal;
      if (!rawMaxEnd || endVal > rawMaxEnd) rawMaxEnd = endVal;
    }

    const minStartDate = formatYyyyMmDdToDdMmYyyy(rawMinStart);
    const maxEndDate = formatYyyyMmDdToDdMmYyyy(rawMaxEnd);

    if (!minStartDate && !maxEndDate) {
      return res.status(200).json({
        success: false,
        code: 200,
        data: {
          min_start_date: null,
          max_end_date: null
        },
        message: 'No valid calendar date rows found in default city calendar file'
      });
    }

    return res.status(200).json({
      success: true,
      code: 200,
      data: {
        min_start_date: minStartDate,
        max_end_date: maxEndDate
      },
      message: 'Default city calendar date range retrieved successfully'
    });
  } catch (err) {
    console.error('Failed to fetch default city calendar range:', err);
    return res.status(500).json({
      success: false,
      code: 500,
      data: null,
      message: 'Failed to retrieve default city calendar range'
    });
  }
};

// GET /api/calendar/default-city/check-service
// Public endpoint (no api_key, no JSON body).
// Query param: ?date=YYYYMMDD or ?date=YYYYMMDD,YYYYMMDD (first date is checked)
// Uses shared default city file:
// users-data/0000000001_0000000002_modified/calendar_0000000001_0000000002(.txt)
const checkDefaultCityService = async (req, res) => {
  try {
    const dateRange = req.query?.date;
    if (!dateRange) {
      return res.status(400).json({
        success: false,
        code: 400,
        data: null,
        message: 'date is required as a query param (YYYYMMDD or YYYYMMDD,YYYYMMDD)'
      });
    }

    const parts = String(dateRange)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (parts.length < 1) {
      return res.status(400).json({
        success: false,
        code: 400,
        data: null,
        message: 'date must be in format YYYYMMDD or YYYYMMDD,YYYYMMDD'
      });
    }

    const checkDateStr = parts[0];
    if (!/^[0-9]{8}$/.test(checkDateStr)) {
      return res.status(400).json({
        success: false,
        code: 400,
        data: null,
        message: 'Invalid date format; expected YYYYMMDD'
      });
    }

    const year = Number(checkDateStr.slice(0, 4));
    const month = Number(checkDateStr.slice(4, 6)) - 1;
    const day = Number(checkDateStr.slice(6, 8));
    const checkDate = new Date(Date.UTC(year, month, day));
    const weekday = checkDate.getUTCDay(); // 0=Sunday..6=Saturday
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayColName = dayMap[weekday];

    const defaultCityIdA = '0000000001';
    const defaultCityIdB = '0000000002';

    let usersDataDir = String(process.env.USERS_DATA_DIR || 'users-data').trim();
    if (!path.isAbsolute(usersDataDir)) {
      usersDataDir = path.join(process.cwd(), usersDataDir);
    }

    const modifiedFolder = `${defaultCityIdA}_${defaultCityIdB}_modified`;
    const resolvedBaseDir = path.basename(usersDataDir) === modifiedFolder
      ? usersDataDir
      : path.join(usersDataDir, modifiedFolder);

    const calendarFileBaseName = `calendar_${defaultCityIdA}_${defaultCityIdB}`;
    const calendarFilePathTxt = path.join(resolvedBaseDir, `${calendarFileBaseName}.txt`);
    const calendarFilePathNoExt = path.join(resolvedBaseDir, calendarFileBaseName);

    const calendarFilePath = fs.existsSync(calendarFilePathTxt)
      ? calendarFilePathTxt
      : (fs.existsSync(calendarFilePathNoExt) ? calendarFilePathNoExt : null);

    if (!calendarFilePath) {
      return res.status(404).json({
        success: false,
        code: 404,
        data: null,
        message: 'Default city calendar file not found'
      });
    }

    const content = fs.readFileSync(calendarFilePath, 'utf8');
    const lines = content.split(/\r?\n/).filter((line) => String(line).trim().length > 0);
    if (lines.length < 2) {
      return res.status(200).json({
        success: false,
        code: 200,
        data: null,
        message: 'No service available on the selected day'
      });
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const startIdx = headers.indexOf('start_date');
    const endIdx = headers.indexOf('end_date');
    const dayIdx = headers.indexOf(dayColName);

    if (startIdx < 0 || endIdx < 0 || dayIdx < 0) {
      return res.status(500).json({
        success: false,
        code: 500,
        data: null,
        message: 'Default city calendar file is missing required columns'
      });
    }

    for (const line of lines.slice(1)) {
      const values = line.split(',').map((v) => v.trim());
      const startVal = values[startIdx] ?? '';
      const endVal = values[endIdx] ?? '';
      const dayVal = values[dayIdx] ?? '';

      if (!/^[0-9]{8}$/.test(startVal) || !/^[0-9]{8}$/.test(endVal)) {
        continue;
      }

      if (startVal <= checkDateStr && endVal >= checkDateStr && String(dayVal) === '1') {
        return res.status(200).json({
          success: true,
          code: 200,
          data: null,
          message: 'Service available on the selected day'
        });
      }
    }

    return res.status(200).json({
      success: false,
      code: 200,
      data: null,
      message: 'No service available on the selected day'
    });
  } catch (err) {
    console.error('Error checking default city calendar:', err);
    return res.status(500).json({
      success: false,
      code: 500,
      data: null,
      message: 'Internal server error',
      error: err.message
    });
  }
};

module.exports = {
  getDefaultCityCalendarRange,
  checkDefaultCityService
};
