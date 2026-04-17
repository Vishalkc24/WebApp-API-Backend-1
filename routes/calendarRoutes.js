const express = require('express');

const router = express.Router();

const calendarController = require('../controller/calendarController');

// GET /api/default-city-calendar-range
// Public endpoint (no api_key required).
// Returns overall date range (min start_date, max end_date)
// from users-data/0000000001_0000000002_modified/calendar_0000000001_0000000002(.txt)
router.get('/api/default-city-calendar-range', calendarController.getDefaultCityCalendarRange);

// GET /api/calendar/default-city/check-service
// Public endpoint (no api_key, no JSON body). Query: ?date=YYYYMMDD or ?date=YYYYMMDD,YYYYMMDD
router.get('/api/calendar/default-city/check-service', calendarController.checkDefaultCityService);

module.exports = router;
