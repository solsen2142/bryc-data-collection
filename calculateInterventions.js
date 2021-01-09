/**
 * Summary. Calculates which students should be placed on academic interventions.
 *
 * Description. This function parses student data from multiple Google Sheets and determines whether
 * the student should be placed into an academic intervention. It then updates the Interventions
 * Google Sheet with this information.
 */
function updateInterventionGrades() {  
  //Open all relevant external spreadsheets
  ////SpreadsheetApp.openById(id): Specifies spreadsheet by ID (found in URL)
  var initialGradesRawDataSS = SpreadsheetApp.openById('[hidden]'); //contains initial grade data from Google Form; will not change
  var attendanceRawDataSS = SpreadsheetApp.openById('[hidden]'); //contains attendance data from Classe; need to manually update every 3 weeks
  var studentsRawDataSS = SpreadsheetApp.openById('[hidden]'); //contains student names, grade level, and program day from Classe; will not change
  var newGradesRawDataSS = SpreadsheetApp.openById('[hidden]'); //contains student-reported grade data, collected every 3 weeks; new entries added continuously
  var programsRawDataSS = SpreadsheetApp.openById('[hidden]'); //contains programs (M/T/W) data
  
  //Open master spreadsheet
  var masterGradesSS = SpreadsheetApp.openById('[hidden]'); //final spreadsheet to which data will be written
  
  //Open all relevant sheets within spreadsheets
  var initialGradesSheet = initialGradesRawDataSS.getSheetByName('Form Responses 1'); 
  var attendanceSheet = attendanceRawDataSS.getSheetByName('Sheet1');
  var studentsSheet = studentsRawDataSS.getSheetByName('Sheet1');
  var newGradesSheet = newGradesRawDataSS.getSheetByName('Form Responses 1');
  var programsSheet = programsRawDataSS.getSheetByName('Sheet1');
  
  //Delete old sheets
  var sheetNames = ['Initial Grades', 'New Grades', 'Attendance', 'Student Data', 'Programs'];
  for(var i = 0; i < sheetNames.length; i++){
    var tempSheet = masterGradesSS.getSheetByName(sheetNames[i]);
    if(tempSheet){
      masterGradesSS.deleteSheet(tempSheet);
    }
  }
  
  //Update spreadsheets in masterGradesSS
  initialGradesSheet.copyTo(masterGradesSS).setName('Initial Grades');
  newGradesSheet.copyTo(masterGradesSS).setName('New Grades');
  attendanceSheet.copyTo(masterGradesSS).setName('Attendance');
  studentsSheet.copyTo(masterGradesSS).setName('Student Data');
  programsSheet.copyTo(masterGradesSS).setName('Programs');
  SpreadsheetApp.flush();
  
  //Define variables for all sheets in masterGradesSS
  var masterGradesFullDataSheet = masterGradesSS.getSheetByName('Full Data'); //contains all students with name, program day, A or B, school, grade level, and grades
  var masterGradesInterventionsSheet = masterGradesSS.getSheetByName('Interventions'); //contains only students with interventions
  var masterGradesInitial = masterGradesSS.getSheetByName('Initial Grades'); //copy of initial grades
  var masterGradesAttendance = masterGradesSS.getSheetByName('Attendance'); //copy of attendance
  var masterGradesStudents = masterGradesSS.getSheetByName('Student Data'); //copy of student data
  var masterGradesNew = masterGradesSS.getSheetByName('New Grades'); //copy of new grades
  var masterGradesPrograms = masterGradesSS.getSheetByName('Programs'); //copy of programs
  
  
  //Assign data to proper columns in Full Data sheet (avoid duplicates)
  ////Loop through names and see if there's a match
  ////If yes, don't add. If no, add to end (using .appendRow)
  ////Sort by last name
  
  //Extract name, BRYC ID, grade, program day, and LW info from Programs sheet
  var data = masterGradesPrograms.getDataRange().getValues();
  for(var i = 1; i < data[].length; i++){
    var grade = identifyGrade(data[3][i]);
    if(grade != 0){
      var id = data[0][i];
      if(!containsID(id,masterGradesFullDataSheet)){
        var first = data[1][i];
        var last = data[2][i];
        var grade = identifyGrade(data[3][i]);
        var programDay = "";
        var learningWorkshop = "";
        if(grade == 9 || grade == 10){
          learningWorkshop = 'A';
        }
        if(grade == 12){
          learningWorkshop = 'N/A';
        }

        //Loop through all rows with same student and find their program day/section
        while(data[1][i] == first && data[2][i] == last){
          var tempProgram = data[5][tempCount];
          if(grade == 9 || grade == 10){
            if(tempProgram.includes('Workshop')){
              programDay = tempProgram.slice(-1);
            }
          }
          if(grade == 11){
            if(tempProgram.includes('Workshop')){
              programDay = tempProgram.slice(-2,-1);
              learningWorkshop = tempProgram.slice(-1);
            }
          }
          if(grade == 12){
            if(tempProgram.includes('ACT')){
              programDay = tempProgram.slice(-2,-1);
            }
          }
          i++;
        }
        masterGradesFullDataSheet.appendRow([id, first, last, grade, "", programDay, learningWorkshop])
      }
      else{
        while(id == data[0][i]){
          i++;
        }
        i--;
      }
    }

  }
}

function identifyGrade(gradeString){
  if(gradeString.includes('9')){
    return 9;
  }
  if(gradeString.includes('10')){
    return 10;
  }
  if(gradeString.includes('11')){
    return 11;
  }
  if(gradeString.includes('12')){
    return 12;
  }
  return 0;
}

function assignProperCase(str){
  return str.replace(/\w\S/g, function(t) { return t.toUpperCase() });
}

function containsID(id,sheet){
  var data = sheet.getDataRange().getValues();
  var found = false;
  for(var i = 0; i < data[0].length; i++){
    if(data[0][i] == id){
      found = true;
    }
  }
  return found;
}