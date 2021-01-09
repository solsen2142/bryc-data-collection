/**
 * Summary. Create and update the master student grade data spreadsheet.
 *
 * Description. Student data was spread over a number of spreadsheets, with no easy way to catalogue
 * and analyze the data. This script combined student grade data into a single Google Sheet;
 * identified which students had low GPAs and needed assistance; calculated and displayed attendance
 * data for our programs; created personalized links for each student to a Google Form for easy
 * grade reporting; and could be used to periodically update the spreadsheet as new grade data was
 * collected via the form. This was used across the organization to view academic performance of
 * all students in the program.
 */
function updateGradesSpring() {  
  //Open master spreadsheet
  var masterGradesSS = SpreadsheetApp.openById('[hidden]'); //final spreadsheet to which data will be written
  
  //Define variables for all sheets in masterGradesSS
  var masterGradesFullDataSheet = masterGradesSS.getSheetByName('Full Data'); //contains all students with name, program day, A or B, school, grade level, and grades
  var masterGradesInterventionsSheet = masterGradesSS.getSheetByName('Interventions'); //contains only students with interventions
  var masterGradesInitial = masterGradesSS.getSheetByName('Initial Grades'); //copy of initial grades
  var masterGradesAttendance = masterGradesSS.getSheetByName('Attendance'); //copy of attendance
  var masterGradesNew = masterGradesSS.getSheetByName('New Grades'); //copy of new grades
  var masterGradesPrograms = masterGradesSS.getSheetByName('Programs'); //copy of programs
  var masterGradesFormLinks = masterGradesSS.getSheetByName('Form Links'); //copy of form links
  var masterGradesContactInfo = masterGradesSS.getSheetByName('Fellow Contact Info'); //copy of contact info
  
  var createFullDataAndInterventionsSheets = true;
  var createNewFormsLinks = false;
  var matchFormsLinkWithEmails = false;
  var updateNewGradeData = true;
  var calculateInterventionsSpread = true;
  
  //Extract name, BRYC ID, grade, program day, and Learning Workshop info from Programs sheet
  if(createFullDataAndInterventionsSheets == true){
    var dataRange = masterGradesPrograms.getDataRange();
    var data = dataRange.getValues();
    var columnLength = getColumnLength(masterGradesPrograms);
    var idArray = [];
    var firstArray = [];
    var lastArray = [];
    var gradeArray = [];
    var blankArray = [];
    var programArray = [];
    var learningArray = [];
    var studentCount = 0;
    
    var masterGradesFullData = masterGradesFullDataSheet.getDataRange().getValues();
    
    for(var i = 1; i < columnLength; i++){
      var currentStudent = [];
      var grade = identifyGrade(data[i][3]);
      if(grade != 0){
        currentStudent[3] = grade;
        var id = data[i][0];
        currentStudent[0] = id;
        var currentRow = getIDRow(id,masterGradesFullData);
        if(currentRow == -1){
          var first = data[i][1];
          var last = data[i][2];
          var programDay = "";
          var learningWorkshop = "";
          if(grade == 9 || grade == 10){
            learningWorkshop = 'A';
          }
          if(grade == 12){
            learningWorkshop = 'N/A';
          }
          
          //Loop through all rows with same student and find their program day/section
          while(data[i][0] == id){
            var tempProgram = data[i][5];
            if(grade == 9 || grade == 10){
              if(tempProgram.indexOf('Workshop')>-1){
                programDay = tempProgram.slice(-1);
              }
            }
            else if(grade == 11){
              if(tempProgram.indexOf('Workshop')>-1){
                programDay = tempProgram.slice(-2,-1);
                learningWorkshop = tempProgram.slice(-1);
              }
            }
            else if(grade == 12){
              if(tempProgram.indexOf('ACT')>-1){
                programDay = tempProgram.slice(-2,-1);
              }
            }
            i++;
          }
          i--;
          idArray[studentCount] = [id];
          firstArray[studentCount] = [first];
          lastArray[studentCount] = [last];
          gradeArray[studentCount] = [grade];
          blankArray[studentCount] = [""];
          programArray[studentCount] = [programDay];
          learningArray[studentCount] = [learningWorkshop];
        }
        else{
          idArray[studentCount] = [masterGradesFullData[currentRow][0]];
          firstArray[studentCount] = [masterGradesFullData[currentRow][1]];
          lastArray[studentCount] = [masterGradesFullData[currentRow][2]];
          gradeArray[studentCount] = [masterGradesFullData[currentRow][3]];
          blankArray[studentCount] = [masterGradesFullData[currentRow][4]];
          programArray[studentCount] = [masterGradesFullData[currentRow][5]];
          learningArray[studentCount] = [masterGradesFullData[currentRow][6]];
          while(id == data[i][0]){
            i++;
          }
          i--;
        }
        studentCount++;
      }
    }
    
    masterGradesFullDataSheet.getRange('A2:A'+(studentCount+1)).setValues(idArray);
    masterGradesFullDataSheet.getRange('B2:B'+(studentCount+1)).setValues(firstArray);
    masterGradesFullDataSheet.getRange('C2:C'+(studentCount+1)).setValues(lastArray);
    masterGradesFullDataSheet.getRange('D2:D'+(studentCount+1)).setValues(gradeArray);
    masterGradesFullDataSheet.getRange('E2:E'+(studentCount+1)).setValues(blankArray);
    masterGradesFullDataSheet.getRange('F2:F'+(studentCount+1)).setValues(programArray);
    masterGradesFullDataSheet.getRange('G2:G'+(studentCount+1)).setValues(learningArray);
    
    masterGradesFullDataSheet.sort(3);
    
    
    //Extract data from Initial Grades spreadsheet and match with Full Data spreadsheet. Also calculates GPA.
    data = masterGradesInitial.getDataRange().getValues();
    columnLength = getColumnLength(masterGradesInitial);
    masterGradesFullData = masterGradesFullDataSheet.getDataRange().getValues();
    
    var classNames = ['English', 'SS', 'Math', 'Science', 'Lang'];
    var classDataPoints = ['Class', 'Grade', 'Percentage'];
    var classNumbers = ['1', '2'];
    
    var arrayHeaders = [];
    var arrayColumns = [];
    for(var i = 0; i < classNames.length; i++){
      for(var j = 0; j < classNumbers.length; j++){
        for(var k = 0; k < classDataPoints.length; k++){
          var currentLocation = i*classDataPoints.length*classNumbers.length+j*classDataPoints.length+k;
          arrayHeaders[currentLocation] = classNames[i] + ' ' + classNumbers[j] + ' ' + classDataPoints[k];
          
          var letter = currentLocation + 8;
          if(letter >= 26){
            arrayColumns[currentLocation] = 'A';
          }
          else{
            arrayColumns[currentLocation] = '';
          }
          arrayColumns[currentLocation] = arrayColumns[currentLocation] + String.fromCharCode(65+(letter%26));
        }
      }
    }
    
    arrayHeaders.push('School');
    arrayColumns.push('E');
    arrayHeaders.push('Initial GPA');
    arrayColumns.push('H');
    
    var classTempArray = [], gpaArray = [], schoolArray = [];
    
    var studentRows = [], gradeSums = [], gradeCount = [];
    
    for(var i = 0; i < columnLength; i++){
      studentRows[i] = getStudentRow(data[i][1], masterGradesFullData);
      gradeSums[studentRows[i]] = 0;
      gradeCount[studentRows[i]] = 0;
    }
    
    for(var i = 0; i < 30; i++){
      for(var j = 1; j < columnLength; j++){
        classTempArray[studentRows[j]] = [data[j][2+i]];        
        if(i%3 == 1 && data[j][2+i] != ""){
          if(i ==1){
            gradeSums[studentRows[j]] += assignGrade(data[j][2+i]);
            gradeCount[studentRows[j]]++;
          }
          else{
            if(data[j][2+i-1] != data[j][2+i-4]){
              gradeSums[studentRows[j]] += assignGrade(data[j][2+i]);
              gradeCount[studentRows[j]]++;
            }
          }
        }
      }
            
      fillAndAssignArray(classTempArray, arrayHeaders[i], arrayColumns[i], masterGradesFullDataSheet, studentCount);
    }
    
    //calculates GPA
    for(var i = 1; i < columnLength; i++){
      classTempArray[studentRows[i]] = [data[i][33]];
      gpaArray[studentRows[i]] = [gradeSums[studentRows[i]]/gradeCount[studentRows[i]]];
    }
    fillAndAssignArray(classTempArray, arrayHeaders[30], arrayColumns[30], masterGradesFullDataSheet, studentCount);
    fillAndAssignArray(gpaArray, arrayHeaders[31], arrayColumns[31], masterGradesFullDataSheet, studentCount);      
  
    //Identify Fellows who need interventions (GPA < 3.3)
    data = masterGradesFullDataSheet.getDataRange().getValues();
    columnLength = getColumnLength(masterGradesFullDataSheet);
    var interID = [], interFirst = [], interLast = [], interGrade = [], interSchool = [];
    var interProgram = [], interLearning = [], interGPA = [], interClass = [], interClassGrade = [];
    var interClassPercent = [];
    var interventionsCount = 0;
    
    for(var i = 0; i < columnLength; i++){
      if(data[i][7] != [''] && data[i][7] < 3.3 && data[i][3] != 12){
        
        //collect current class grades
        var currentClassNames = [];
        var currentClassGrades = [];
        var currentClassPercents = [];
        for(var j = 0; j < 10; j++){
          currentClassNames[j] = data[i][8+3*j];
          currentClassGrades[j] = data[i][9+3*j]
          currentClassPercents[j] = data[i][10+3*j];
        }
        
        for(var j = 0; j < 10; j++){
          if(isBOrBelow(currentClassGrades[j])){
            interID[interventionsCount] = [data[i][0]];
            interFirst[interventionsCount] = [data[i][1]];
            interLast[interventionsCount] = [data[i][2]];
            interGrade[interventionsCount] = [data[i][3]];
            interSchool[interventionsCount] = [data[i][4]];
            interProgram[interventionsCount] = [data[i][5]];
            interLearning[interventionsCount] = [data[i][6]];
            interGPA[interventionsCount] = [gpaArray[i]];
            
            interClass[interventionsCount] = [currentClassNames[j]];
            interClassGrade[interventionsCount] = [currentClassGrades[j]];
            interClassPercent[interventionsCount] = [currentClassPercents[j]];
            interventionsCount++;
          }
        }
      }
    }
    interventionsCount--;
    
    var allArrays = [interID, interFirst, interLast, interGrade, interSchool, interProgram, interLearning, interGPA,
                 interClass, interClassGrade, interClassPercent];
    arrayHeaders = ['BRYC ID', 'First Name', 'Last Name', 'Grade Level', 'School', 'Program Day', 'A or B?', 'Initial GPA', 'Problem Class', 'Initial Grade', 'Initial %'];
    arrayColumns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M'];
    
    for(var i = 0; i < allArrays.length; i++){
      fillAndAssignArray(allArrays[i], arrayHeaders[i], arrayColumns[i], masterGradesInterventionsSheet, interventionsCount);
    }  
  

    //Calculate attendance percentage
    
    data = masterGradesAttendance.getDataRange().getValues();
    var attendanceArray = [];
    
    for(var i = 1; i <= interventionsCount; i++){
      var attendanceRow = getAttendanceRow(interID[i], data);
      var totalPresent = data[attendanceRow][5]+data[attendanceRow][7];
      var totalPossible = data[attendanceRow][6]+data[attendanceRow][8];
      var attendancePercentage = totalPresent/totalPossible;
      attendanceArray[i] = [attendancePercentage];
    }
    
    fillAndAssignArray(attendanceArray, 'Attendance', 'I', masterGradesInterventionsSheet, interventionsCount);
    
    //Assign colors to attendance percentages
    var colors = [];
    colors[0] = [null];
    for(var i = 1; i <= interventionsCount; i++){
      if(attendanceArray[i] < 0.6){
        colors[i] = ['#FA8072']; //red
      }
      else if(attendanceArray[i] >= 0.6 && attendanceArray[i] < 0.8){
        colors[i] = ['#FFFF99']; //yellow
      }
      else{
        colors[i] = ['#90EE90']; //green
      }
    }
    
    masterGradesInterventionsSheet.getRange('I1:I'+(interventionsCount+1)).setBackgrounds(colors);
  }
  
  //Create grade collection form links
  if(createNewFormsLinks == true){
    data = masterGradesInterventionsSheet.getDataRange().getValues();
    
    //remove name duplicates
    var interFirstFinal = [];
    var interLastFinal = [];
    var studentCount = 1;
    var interClassesFinal = [];
    var columnLength = getColumnLength(masterGradesInterventionsSheet);

    // Loop through all students in interventions
    for(var i = 1; i < columnLength; i++){
      interFirstFinal[studentCount] = data[i][1];
      interLastFinal[studentCount] = data[i][2];
      var classes = [];
      var cnt = 0;

      // Collect all problem classes for this student
      while(i < columnLength && data[i][1] == interFirstFinal[studentCount]){
        classes[cnt] = [data[i][10]];
        cnt++;
        i++;
      }
      i--;

      interFirstFinal[studentCount] = [interFirstFinal[studentCount]];
      interLastFinal[studentCount] = [interLastFinal[studentCount]];
      interClassesFinal[studentCount] = classes;
      studentCount++;
    }
    studentCount--;
    
    //Create pre-filled url for form; can be very slow due to Forms API calls, but now it's fast :)
    var formLinksArray = [];
    var shortenedLinksArray = [];
    
    var form = FormApp.openById('1hRIUQOWjPXMnkQB7efsGmiM_d7YPSjQqMZ_X8OJ3jsA');
    var items = form.getItems();
      
    for(var i = 1; i <= studentCount; i++){

      // The entry numbers can be found by clicking "create pre-filled link" on the Google Form
      //The faster way:
      var urlBuilder = "https://docs.google.com/forms/d/e/1FAIpQLSfoXNxWZdq_nsNnWBCRVueBjx_0PXxmL96qxAnCIjG8wK0g3w/viewform?usp=pp_url";
      var nameUrl = "&entry.766874105="; //example: &entry.766874105=Justin+Adeola
      var classUrls = ["&entry.1956413178=", "&entry.1529385234=", "&entry.2055879900=", "&entry.1485132249=", "&entry.1662604015="]; //start of URLs for classes 1 through 5
      nameUrl += String(interFirstFinal[i]).replace(/\s/g, "+")+'+'+String(interLastFinal[i]).replace(/\s/g, "+");
      for(var j = 0; j < 5; j++){
        if(interClassesFinal[i][j]){
          classUrls[j] += String(interClassesFinal[i][j]).replace(/\s/g, "+");
        }
        else{
          classUrls[j] += 'None';
        }
      }
      
      urlBuilder += nameUrl;
      for(var j = 0; j < 5; j++){
        urlBuilder += classUrls[j];
      }
      
      formLinksArray[i] = [urlBuilder];
      
      //Create shortened URL
      var tinyUrlLink = 'http://tinyurl.com/api-create.php?url='+urlBuilder;
      var response = UrlFetchApp.fetch(tinyUrlLink);
      var text = response.getContentText();
      
      shortenedLinksArray[i] = [text];
    }
    
    fillAndAssignArray(interFirstFinal, 'First', 'A', masterGradesFormLinks, studentCount);
    fillAndAssignArray(interLastFinal, 'Last', 'B', masterGradesFormLinks, studentCount);
    fillAndAssignArray(formLinksArray, 'Form Link', 'C', masterGradesFormLinks, studentCount);
    fillAndAssignArray(shortenedLinksArray, 'Shortened Link', 'D', masterGradesFormLinks, studentCount);
  }
  
  //Add emails and guardian emails to Form Links sheet
  if(matchFormsLinkWithEmails == true){
    data = masterGradesContactInfo.getDataRange().getValues();
    var data2 = masterGradesFormLinks.getDataRange().getValues();
    var data3 = masterGradesFullDataSheet.getDataRange().getValues();
    columnLength = getColumnLength(masterGradesFormLinks);
    
    var studentEmailArray = [];
    var guardianEmailArray = [];
    var studentSchoolArray = [];
    
    for(var i = 1; i < columnLength; i++){
      studentRow = getStudentRow(data2[i][0]+' '+data2[i][1],data);
      studentRow2 = getStudentRow(data2[i][0]+' '+data2[i][1],data3);
      
      studentEmailArray[i] = [data[studentRow][4]];
      guardianEmailArray[i] = [data[studentRow][3]];
      studentSchoolArray[i] = [data3[studentRow2][4]]
    }
    columnLength--;
    
    fillAndAssignArray(studentEmailArray, 'Student Email', 'E', masterGradesFormLinks, columnLength);
    fillAndAssignArray(guardianEmailArray, 'Guardian Email', 'F', masterGradesFormLinks, columnLength);
    fillAndAssignArray(studentSchoolArray, 'School', 'G', masterGradesFormLinks, columnLength);
  }
  
  //Update list with new grade data
  ////For each row in New Grades sheet: for each class in that row:
  ////Find student and class in Interventions sheet and add new grade to column for corresponding week
  if(updateNewGradeData == true){
    var data = masterGradesNew.getDataRange().getValues();
    var data2 = masterGradesInterventionsSheet.getDataRange().getValues();
    var columnLength = getColumnLength(masterGradesNew);
    var columnLength2 = getColumnLength(masterGradesInterventionsSheet);
    
    //also need for percentages
    var week1LetterArray = [];
    var week1PercentArray = [];
    var week2LetterArray = [];
    var week2PercentArray = [];
    var week3LetterArray = [];
    var week3PercentArray = [];
    var week4LetterArray = [];
    var week4PercentArray = [];
    var week5LetterArray = [];
    var week5PercentArray = [];
    
    var maxStudentRow1 = 0;
    var maxStudentRow2 = 0;
    var maxStudentRow3 = 0;
    var maxStudentRow4 = 0;
    var maxStudentRow5 = 0;
    
    for(var i = 1; i < columnLength; i++){
      var studentName = data[i][1];
      var studentRow = getStudentRow(studentName, data2);
      Logger.log(studentName+" is located at row "+studentRow+"/n");
      var week = data[i][2]; // 2/10, 3/9, 3/23, 4/13, 5/4
      
      for(var j = 0; j < 5; j++){
        var currentClass = data[i][3+3*j];
        if(currentClass != 'None' && currentClass != ''){
          var currentLetterGrade = data[i][4+3*j];
          var currentPercentGrade = data[i][5+3*j];
          var notFound = true;
          for(var k = 0; k < 5; k++){
            if(studentRow+k < columnLength2 && data2[studentRow+k][10] == currentClass && notFound){
              notFound = false;
              if(week == 'Week of February 10th'){
                week1LetterArray[studentRow+k] = [currentLetterGrade];
                week1PercentArray[studentRow+k] = [currentPercentGrade];
                if(studentRow+k > maxStudentRow1){
                  maxStudentRow1 = studentRow+k;
                }
              }
              else if(week == 'Week of March 9th'){
                week2LetterArray[studentRow+k] = [currentLetterGrade];
                week2PercentArray[studentRow+k] = [currentPercentGrade];
                if(studentRow+k > maxStudentRow2){
                  maxStudentRow2 = studentRow+k;
                }
              }
              else if(week == 'Week of March 23rd'){
                week3LetterArray[studentRow+k] = [currentLetterGrade];
                week3PercentArray[studentRow+k] = [currentPercentGrade];
                if(studentRow+k > maxStudentRow3){
                  maxStudentRow3 = studentRow+k;
                }
              }
              else if(week == 'Week of April 13th'){
                week4LetterArray[studentRow+k] = [currentLetterGrade];
                week4PercentArray[studentRow+k] = [currentPercentGrade];
                if(studentRow+k > maxStudentRow4){
                  maxStudentRow4 = studentRow+k;
                }
              }
              else if(week == 'Week of May 4th'){
                week5LetterArray[studentRow+k] = [currentLetterGrade];
                week5PercentArray[studentRow+k] = [currentPercentGrade];
                if(studentRow+k > maxStudentRow5){
                  maxStudentRow5 = studentRow+k;
                }
              }
            }
          }
        }
      }
    }
    
    fillAndAssignArray(week1LetterArray, 'Grade 2/10', 'N', masterGradesInterventionsSheet, maxStudentRow1);
    fillAndAssignArray(week1PercentArray, '%', 'O', masterGradesInterventionsSheet, maxStudentRow1);
    fillAndAssignArray(week2LetterArray, 'Grade 3/9', 'P', masterGradesInterventionsSheet, maxStudentRow2);
    fillAndAssignArray(week2PercentArray, '%', 'Q', masterGradesInterventionsSheet, maxStudentRow2);
    fillAndAssignArray(week3LetterArray, 'Grade 3/23', 'R', masterGradesInterventionsSheet, maxStudentRow3);
    fillAndAssignArray(week3PercentArray, '%', 'S', masterGradesInterventionsSheet, maxStudentRow3);
    fillAndAssignArray(week4LetterArray, 'Grade 4/13', 'T', masterGradesInterventionsSheet, maxStudentRow4);
    fillAndAssignArray(week4PercentArray, '%', 'U', masterGradesInterventionsSheet, maxStudentRow4);
    fillAndAssignArray(week5LetterArray, 'Grade 5/4', 'V', masterGradesInterventionsSheet, maxStudentRow5);
    fillAndAssignArray(week5PercentArray, '%', 'W', masterGradesInterventionsSheet, maxStudentRow5);
  }
  
  //Calculate net change in grade for each identified Fellow (ie, +8, -3) and color code
  if(calculateInterventionsSpread == true){
    data = masterGradesInterventionsSheet.getDataRange().getValues();
    var columnLength = getColumnLength(masterGradesInterventionsSheet);
    
    var gradeChangeArray = [];
    var colorsArray = [];
    colorsArray[0] = [null];
    
    for(var i = 1; i < columnLength; i++){
      var initialGrade;
      if(data[i][12]){
      	initialGrade = data[i][12];
      	initialGradePosition = 12;
      }
      else{
      	initialGrade = null;
      	initialGradePosition = 0;
      }
      var finalGrade = null;
      for(var j = 0; j < 5; j++){ //checks for up to 5 dates
        var currentGrade = data[i][14+2*j];
        if(currentGrade){
        	if(initialGrade == null){
	        	initialGrade = currentGrade;
	        	initialGradePosition = 14+2*j;
        	}
        	else{
	        	finalGrade = currentGrade;        		
        	}
        }
      }
      
      if(initialGrade != null && finalGrade != null){
        var gradeChange = computeGradePercentSpread(initialGrade,finalGrade);
        gradeChangeArray[i] = [gradeChange];
        
        if(gradeChange.charAt(0) == '+'){
          colorsArray[i] = ['#90EE90']; //green
        }
        else if(gradeChange.charAt(0) == '-'){
          colorsArray[i] = ['#FA8072']; //red
        }
        else{
          colorsArray[i] = ['#FFFF99']; //yellow
        }
      }

      else if(initialGrade != null && finalGrade == null && initialGradePosition != 12){
        initialGrade = data[i][11];
        var currentGrade = data[i][initialGradePosition-1];
        var gradeChange = computeGradeLetterSpread(initialGrade,currentGrade);
        gradeChangeArray[i] = [gradeChange];
        
        if(gradeChange.charAt(0) == '+'){
          colorsArray[i] = ['#90EE90']; //green
        }
        else if(gradeChange.charAt(0) == '-'){
          colorsArray[i] = ['#FA8072']; //red
        }
        else{
          colorsArray[i] = ['#FFFF99']; //yellow
        }
      }

      else{
        gradeChangeArray[i] = [''];
        colorsArray[i] = [null];
      }
    }
    columnLength--;
    
    fillAndAssignArray(gradeChangeArray, 'Spread', 'J', masterGradesInterventionsSheet, columnLength);
    masterGradesInterventionsSheet.getRange('J1:J'+(columnLength+1)).setBackgrounds(colorsArray);
  }
  
}
  
  
  
//Helper Functions

function replaceWithPlusSigns(str){
  return 0;
}

function computeGradeLetterSpread(initialGrade, currentGrade){
  grades = ['F', 'D', 'C', 'B', 'A'];
  var currentLoc = 0;
  var initialLoc = 0;
  for(var i = 0; i < 5; i++){
    if(grades[i] == currentGrade){
      currentLoc = i;
    }
    if(grades[i] == initialGrade){
      initialLoc = i;
    }
  }
  if(currentLoc == initialLoc){
    return 0+" (lg)";
  }
  else if(currentLoc > initialLoc){
    return "+"+(currentLoc-initialLoc)+" (lg)";
  }
  else{
    return "-"+(initialLoc-currentLoc)+" (lg)";
  }
}

function computeGradePercentSpread(initialGrade,currentGrade){
  if(initialGrade == currentGrade){
    return 0+"%";
  }
  else if(currentGrade > initialGrade){
    return "+"+(currentGrade-initialGrade)+"%";
  }
  else{
    return "-"+(initialGrade-currentGrade)+"%";
  }
}

function identifyGrade(gradeString){
  if(gradeString.indexOf('9')>-1){
    return 9;
  }
  if(gradeString.indexOf('10')>-1){
    return 10;
  }
  if(gradeString.indexOf('11')>-1){
    return 11;
  }
  if(gradeString.indexOf('12')>-1){
    return 12;
  }
  return 0;
}

function assignProperCase(str) {
  str = str.toLowerCase().split(' ');
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); 
  }
  return str;
}

function splitFirst(str){
  var strSeparated = str.split(' ');
  return assignProperCase(strSeparated[0]);
}

function splitLast(str){
  var strSeparated = str.split(" ");
  var cnt = 0;
  return assignProperCase(strSeparated[strSeparated.length-1-cnt]);
}

function getColumnLength(sheet){
  var firstColumn = sheet.getRange("A1:A").getValues();
  var columnLength = firstColumn.filter(String).length;
  return columnLength;
}

function getIDRow(id, data){
  for(var i = 1; i < data.length; i++){
    if(data[i][0] == id){
      return i;
    }
  }
  return -1;
}

function isSameStudentName(realFirst, realLast, checkName){
  var realName = realFirst.concat(realLast).toLowerCase();
  checkName = checkName.toLowerCase();
  return (realName.replace(/[^0-9a-z]/gi, '') == checkName.replace(/[^0-9a-z]/gi, ''));
}

function getStudentRow(name, data){
  for(var i = 1; i < data.length; i++){
    if(isSameStudentName(data[i][1],data[i][2],name)){
       return i;
    }
  }
  return -1;
}

function getAttendanceRow(id, data){
  for(var i = 1; i < data.length; i++){
    if(data[i][0]==id){
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
  array[0] = [header];
  dataSheet.getRange(columnLetter+'1:'+columnLetter+(studentCount+1)).setValues(array);
}

function assignGrade(letter) {
  var grades = ['A', 'B', 'C', 'D', 'F'];
  var points = [4, 3, 2, 1, 0];
  
  for(var i = 0; i < 5; i++){
    if(letter == grades[i]){
      return points[i];
    }
  }
  return -1;
}

function isBOrBelow(grade){
  if(grade == 'B' || grade == 'C' || grade == 'D' || grade == 'F'){
    return true;
  }
  return false;
}