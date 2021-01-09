/**
 * Summary. Updates Google Sheet containing student grade and attendance information.
 *
 * Description. Students with poor grades were monitored to track their improvement with the help
 * of our interventions. Courses in which students had poor grades were called their "focus classes".
 * This script compiled and combined focus class grade data over time to show trends, while also
 * including their attendance percentage for our programs. This was used by the Learning Team to
 * determine which interventions were successful and which needed to be tweaked.
 */
function updateRTISheet() {  
	var RTISpreadsheet = SpreadsheetApp.openById('[hidden]');
	var focusClassSpreadsheet = SpreadsheetApp.openById('[hidden]');
	var purpleAttendanceSpreadsheet = SpreadsheetApp.openById('[hidden]');

	var RTIClassSheet = RTISpreadsheet.getSheetByName('Spring 2020');
	var RTIAttendanceSheet = RTISpreadsheet.getSheetByName('Attendance');
	var focusClassSheet = focusClassSpreadsheet.getSheetByName('Sheet1');
	var purpleAttendanceSheet = purpleAttendanceSpreadsheet.getSheetByName('Additional Attendance Tracker');

	//Match Fellows to their focus classes
	var focusClassData = focusClassSheet.getDataRange().getValues();
	var RTIFullData = RTIClassSheet.getDataRange().getValues();

	var columnLength = getColumnLength(focusClassSheet);

	var focusClass1 = [];
	var focusClass2 = [];
	var focusClass3 = [];
	var focusClass4 = [];
	var focusClass5 = [];

	var studentCount = 0;

	for(var i = 0; i < columnLength; i++){
		var fellowFirst = focusClassData[i][0];
		var fellowLast = focusClassData[i][1];
		var focus1 = focusClassData[i][2];
		var focus2 = focusClassData[i][3];
		var focus3 = focusClassData[i][4];
		var focus4 = focusClassData[i][5];
		var focus5 = focusClassData[i][6];

		var RTIStudentRow = getStudentRow(fellowFirst+" "+fellowLast,RTIFullData);

		focusClass1[RTIStudentRow] = [focus1];
		focusClass2[RTIStudentRow] = [focus2];
		focusClass3[RTIStudentRow] = [focus3];
		focusClass4[RTIStudentRow] = [focus4];
		focusClass5[RTIStudentRow] = [focus5];

		if(RTIStudentRow > studentCount){
			studentCount = RTIStudentRow;
		}
	}

	fillAndAssignArray(focusClass1, "Focus Class 1", "F", RTIClassSheet, studentCount);
	fillAndAssignArray(focusClass2, "Focus Class 2", "G", RTIClassSheet, studentCount);
	fillAndAssignArray(focusClass3, "Focus Class 3", "H", RTIClassSheet, studentCount);
	fillAndAssignArray(focusClass4, "Focus Class 4", "I", RTIClassSheet, studentCount);
	fillAndAssignArray(focusClass5, "Focus Class 5", "J", RTIClassSheet, studentCount);

	//Match Fellows to their additional LW attendance percentages
	var purpleAttendanceData = purpleAttendanceSheet.getDataRange().getValues();

	var columnLength = getColumnLength(purpleAttendanceSheet);

	var purpleAttendance = [];

	var studentCount = 0;

	for(var i = 1; i < columnLength; i++){
		var fellowFirst = purpleAttendanceData[i][0];
		var fellowLast = purpleAttendanceData[i][1];
		var purpleAttendPercent = purpleAttendanceData[i][28]*100 + "%";

		var RTIStudentRow = getStudentRow(fellowFirst+" "+fellowLast,RTIFullData);

		purpleAttendance[RTIStudentRow] = [purpleAttendPercent];

		if(RTIStudentRow > studentCount){
			studentCount = RTIStudentRow;
		}
	}

	fillAndAssignArray(purpleAttendance, "Addl Atten.", "L", RTIClassSheet, studentCount);

	//Match Fellows to their overall attendance percentage
	var allAttendanceData = RTIAttendanceSheet.getDataRange().getValues();

	var columnLength = getColumnLength(RTIAttendanceSheet);

	var allAttendance = [];
	var attendanceNums = [];

	var studentCount = 0;

	for(var i = 1; i < columnLength; i++){
		var fellowFirst = allAttendanceData[i][0];
		var fellowLast = allAttendanceData[i][1];
		var allAttendPercent = allAttendanceData[i][2]*100 + "%";

		var RTIStudentRow = getStudentRow(fellowFirst+" "+fellowLast,RTIFullData);

		if(RTIStudentRow != -1){
			attendanceNums[RTIStudentRow] = allAttendanceData[i][2];
			allAttendance[RTIStudentRow] = [allAttendPercent];

			if(RTIStudentRow > studentCount){
				studentCount = RTIStudentRow;
			}
		}
	}

	fillAndAssignArray(allAttendance, "Reg. Atten.", "K", RTIClassSheet, studentCount);

	//Assign colors to attendance percentages
    var colors = [];
    colors[0] = [null];
    colors[1] = ['#f3f3f3'];
    for(var i = 2; i <= studentCount; i++){
      var att = attendanceNums[i];
      if(att < 0.6){
        colors[i] = ['#FA8072']; //red
      }
      else if(att >= 0.6 && att < 0.8){
        colors[i] = ['#FFFF99']; //yellow
      }
      else{
        colors[i] = ['#90EE90']; //green
      }
    }
    
    RTIClassSheet.getRange('K1:K'+(studentCount+1)).setBackgrounds(colors);
 
}


//Helper Functions

function isSameStudentName(realFirst, realLast, checkName){
  var realName = realFirst.concat(realLast).toLowerCase();
  checkName = checkName.toLowerCase();
  return (realName.replace(/[^0-9a-z]/gi, '') == checkName.replace(/[^0-9a-z]/gi, ''));
}

function getStudentRow(name, data){
  for(var i = 1; i < data.length; i++){
    if(isSameStudentName(data[i][0],data[i][1],name)){
       return i;
    }
  }
  return -1;
}

function fillAndAssignArray(array, header, columnLetter, dataSheet, studentCount){
  for(var i = 0; i <= studentCount; i++){
    if(!array[i]){
      array[i] = [''];
    }
  }
  array[1] = [header];
  dataSheet.getRange(columnLetter+'1:'+columnLetter+(studentCount+1)).setValues(array);
}

function getColumnLength(sheet){
  var firstColumn = sheet.getRange("A1:A").getValues();
  var columnLength = firstColumn.filter(String).length;
  return columnLength;
}