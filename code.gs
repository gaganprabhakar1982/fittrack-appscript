// GLOBAL CONSTANTS - MAKE SURE THESE ARE AT THE TOP
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const WORKOUT_PLAN_SHEET_NAME = "WorkoutPlan";
const WORKOUT_LOG_SHEET_NAME = "WorkoutLog";

// MAIN FUNCTION FOR WEB APP
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('FitTrack') // Ensure this matches the <title> in Index.html
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    // Meta tags for PWA are now primarily in Index.html for better control
}

// HELPER FUNCTION TO GET TODAY'S DATE STRING FOR HTML
function getTodaysDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = ('0' + (today.getMonth() + 1)).slice(-2);
  const day = ('0' + today.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

// FUNCTION TO GET WORKOUT PLAN FROM SHEET
function getWorkoutPlan(dateString) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(WORKOUT_PLAN_SHEET_NAME);
    if (!sheet) throw new Error("WorkoutPlan sheet not found. Check sheet name and SPREADSHEET_ID.");

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const plan = [];

    const dateCol = headers.indexOf("Date");
    const exerciseCol = headers.indexOf("Exercise");
    const typeCol = headers.indexOf("Exercise Type");
    const setsCol = headers.indexOf("Target Sets");
    const repsTimeCol = headers.indexOf("Target Reps/Time");
    const weightSpeedCol = headers.indexOf("Target Weight (kg) / Speed (km/hr)");
    const inclineLevelCol = headers.indexOf("Target Incline/Level");
    const notesCol = headers.indexOf("Notes");

    if ([dateCol, exerciseCol, setsCol, repsTimeCol].some(col => col === -1)) {
      let missingCols = [];
      if(dateCol === -1) missingCols.push("Date");
      if(exerciseCol === -1) missingCols.push("Exercise");
      if(setsCol === -1) missingCols.push("Target Sets");
      if(repsTimeCol === -1) missingCols.push("Target Reps/Time");
      throw new Error(`One or more required columns are missing in WorkoutPlan sheet: ${missingCols.join(', ')}.`);
    }
    if (typeCol === -1) {
        Logger.log("Warning: 'Exercise Type' column not found in WorkoutPlan sheet. Icons might not work as expected.");
    }
     if (notesCol === -1) {
        Logger.log("Warning: 'Notes' column not found in WorkoutPlan sheet. Subtitles might be missing.");
    }
    
    let planDate = new Date(dateString + "T00:00:00"); 

    for (let i = 1; i < data.length; i++) {
      let rowDateVal = data[i][dateCol];
      let rowDate;
      if (rowDateVal instanceof Date) {
        rowDate = rowDateVal;
      } else if (typeof rowDateVal === 'string' || typeof rowDateVal === 'number') {
        const parts = String(rowDateVal).split('-');
        if (parts.length === 3) {
            rowDate = new Date(parts[0], parts[1] - 1, parts[2]); 
        } else {
            rowDate = new Date(rowDateVal); 
        }
      } else {
        continue; 
      }

      rowDate.setHours(0,0,0,0); 
      
      if (rowDate.getTime() === planDate.getTime()) {
        plan.push({
          exercise: data[i][exerciseCol],
          exerciseType: typeCol !== -1 ? data[i][typeCol] : "Default",
          targetSets: data[i][setsCol],
          targetRepsTime: data[i][repsTimeCol],
          targetWeightSpeed: weightSpeedCol !== -1 ? data[i][weightSpeedCol] : "",
          targetInclineLevel: inclineLevelCol !== -1 ? data[i][inclineLevelCol] : "",
          notes: notesCol !== -1 ? data[i][notesCol] : ""
        });
      }
    }
    return { success: true, data: plan };
  } catch (error) {
    Logger.log("Error in getWorkoutPlan: " + error.toString() + " Stack: " + (error.stack ? error.stack : 'No stack'));
    return { success: false, message: "Error fetching plan: " + error.message };
  }
}

// FUNCTION TO LOG WORKOUT ENTRY TO SHEET
function logWorkoutEntry(logData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(WORKOUT_LOG_SHEET_NAME);
    if (!sheet) throw new Error("WorkoutLog sheet not found. Check sheet name.");

    const timestamp = new Date();
    sheet.appendRow([
      timestamp,
      logData.dateOfWorkout,
      logData.exerciseLogged,
      logData.set,
      logData.actualRepsTime,
      logData.actualWeightSpeed,
      logData.actualInclineLevel,
      logData.userNotes
    ]);
    return { success: true, message: "Entry logged successfully!" };
  } catch (error) {
    Logger.log("Error in logWorkoutEntry: " + error.toString() + " Stack: " + (error.stack ? error.stack : 'No stack'));
    return { success: false, message: "Failed to log entry: " + error.message };
  }
}
