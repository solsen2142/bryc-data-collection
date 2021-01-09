/**
 * Summary. Creates custom Google Form allowing students to report their grade data.
 *
 * Description. In Louisiana, eligibility for TOPS (a state-run scholarship fund) is dependent on 
 * ACT score and "Core GPA". Students take many different classes, some of which are not considered
 * "Core" classes and which thus do not count towards TOPS eligibility. To help determine which students
 * are eligible for TOPS and which may need help or tutoring, this function creates a custom Google Form
 * which accurately reflects the classes each student is taking. This allows for much easier
 * self-reporting of grade data by the students.
 */
function createGradeFormQuestions() {
  var FORM_ID = "[hidden]";
  
  var OPTIONS_SPREADSHEET_ID = "[hidden]";
  var OPTIONS_SHEET_NAME = "Interventions";
  
  var optionsSheet = SpreadsheetApp.openById(OPTIONS_SPREADSHEET_ID).getSheetByName(OPTIONS_SHEET_NAME);
  var columnLength = getColumnLength(optionsSheet);
  var DATA_RANGE = "B2:C"+columnLength; //from BRYC ID to Problem Classes

  //Get first name, last name, and day from Interventions spreadsheet
  var dataArray = optionsSheet.getRange(DATA_RANGE).getValues();
  var optionsFirst = [];
  var optionsLast = [];
  for(var i = 0; i < dataArray.length; i++){
    optionsFirst.push(dataArray[i][0]);
    optionsLast.push(dataArray[i][1]);
  }
  
  //Combine first and last names
  var optionsFullNames = [];
  for(var i = 0; i < optionsFirst.length; i++){
    optionsFullNames[i] = optionsFirst[i] + ' ' + optionsLast[i];
  }
  
  //Remove duplicates
  var optionsFinalData = [];
  var studentCount = 0;
  for(var i = 0; i < optionsFullNames.length; i++){
    optionsFinalData[studentCount] = optionsFullNames[i];
    while(optionsFullNames[i] == optionsFinalData[studentCount]){
      i++;
    }
    studentCount++;
  }
  
  //Open Grade Update Form
  var form = FormApp.openById(FORM_ID);
  
  //reset form to blank state  
  var allItems = form.getItems();
  for(var i = 0; i < allItems.length; i++){
    form.deleteItem(0);
  }
  
  //Set form name and description
  form.setTitle('Grade Update Form');
  form.setDescription('TODO');

  //Create Fellow name prompt (autofilled by link)
  var nameItem = form.addListItem()
  	.setTitle('Fellow Name')
  	.setChoiceValues(optionsFinalData);

  //Create week prompt (Fellow selects)
  var weeks = ['Week of October 21st', 'Week of November 4th', 'Week of November 18th'];
  form.addListItem()
      .setTitle('In which week are you reporting grades?')
      .setChoiceValues(weeks)
      .isRequired(true);

  //Create class and grade prompts (class autofilled; grades filled by Fellow)
  var gradeLetters = ['A', 'B', 'C', 'D', 'F'];
  var gradeNumbers = [];
  for(var i = 0; i < 50; i++){
    gradeNumbers[i] = 100-i;
  }
  gradeNumbers[50] = "Less than 50%"

  var classItems = [];
  var classGradeLetterItems = [];
  var classGradeNumberItems = [];

  for(var i = 0; i < 5; i++){
  	classItems[i] = form.addTextItem().setTitle('Class '+i+' (DO NOT CHANGE)');
  	classGradeLetterItems[i] = form.addTextItem().setTitle('Class '+i+' Letter Grade');
  	classGradeNumberItems[i] = form.addTextItem().setTitle('Class '+i+' Percent Grade')
  }
}