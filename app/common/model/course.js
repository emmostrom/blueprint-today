
Course = new Meteor.Collection("course")

Meteor.subscription("allCourse",  function () {
	return Course.find({userId: this.userId}, {})
});

Meteor.methods({
    
  saveCourse: function(course){
    checkLogIn(this)
    check(course.title, String)

    if(hasId(course))
	 	Course.update({_id: course._id, userId: this.userId}, {$set: {title: course.title, students: course.students}})
    else
      return Course.insert({termId: course.termId, userId: this.userId, title: course.title, students: course.students, days: []})
  },
  
  saveCourseDescription: function(courseId, dayNumber, description){
    checkLogIn(this)
    var count = Course.update({_id: courseId, userId: this.userId, 'days.dayNumber': dayNumber}, {$set: {'days.$.description': description} })
    if(count == 0)
      Course.update({_id: courseId, userId: this.userId}, {$push: {'days': {dayNumber: dayNumber, description: description} } })
  },
  
  saveCourseGrade: function(courseId, studentId, dayNumber, gradeText){
    checkLogIn(this)
    var field = studentId + '_gradeText'
    var obj = {}
    obj['days.$.' + field] = gradeText
    var count = Course.update({_id: courseId, userId: this.userId, 'days.dayNumber': dayNumber}, {$set: obj })
    if(count == 0){
      obj = {dayNumber: dayNumber}
      obj[field] = gradeText
      Course.update({_id: courseId, userId: this.userId}, {$push: {'days': obj } })
    }
  },
  
  deleteCourse: function(course){
    checkLogIn(this)
    
    if(hasId(course))
	 	Course.remove({_id: course._id, userId: this.userId})
  }
  
})

Course.setDescription = function(courseId, week, dow, description){
  var dayNumber = +dow + ((week - 1) * 7)
  Meteor.call('saveCourseDescription', courseId, dayNumber, description)
}

Course.setGrade = function(courseId, studentId, week, dow, gradeText){
  var dayNumber = +dow + ((week - 1) * 7)
  Meteor.call('saveCourseGrade', courseId, studentId, dayNumber, gradeText)
}


Course.getSchedule = function(termId, week){
  var schedule = []
  var courses = Course.find({termId: termId}, {sort: {title: 1}}).fetch()
  var students = Student.find({}, {sort:{name: 1}}).fetch()
  
  for(var s = 0; s < students.length; s++){
    var student = students[s]
    
    var courseGroup = {
      title: student.name,
      _header: true
    }
    schedule.push(courseGroup)
    
    for(var c = 0; c < courses.length; c++){
      var course = courses[c]
      var days = course.days || []
      var enrolled = course.students || []
      if($.inArray(student._id, enrolled) != -1){
        var courseSchedule = {
          title: course.title,
          studentId: student._id,
          courseId: course._id,
          weekNumber: week,
          g1: getGrade(days, student, week, 1),
          d1: getDescription(days, week, 1),
          g2: getGrade(days, student, week, 2),
          d2: getDescription(days, week, 2),
          g3: getGrade(days, student, week, 3),
          d3: getDescription(days, week, 3),
          g4: getGrade(days, student, week, 4),
          d4: getDescription(days, week, 4),
          g5: getGrade(days, student, week, 5),
          d5: getDescription(days, week, 5),
          g6: getGrade(days, student, week, 6),
          d6: getDescription(days, week, 6),
          g7: getGrade(days, student, week, 7),
          d7: getDescription(days, week, 7)
        }
        schedule.push(courseSchedule)
      }
    }
  }
  
  return schedule
}
 
function getGrade(days, student, week, dayOfWeek){
  for(var i = 0; i < days.length; i++){
    var courseDay = days[i]
    if(courseDay.dayNumber == +dayOfWeek + ((week - 1) * 7)){
      return courseDay[student._id + '_gradeText'] || ""
    }
  }
  return ""
}

function getDescription(days, week, dayOfWeek){
  for(var i = 0; i < days.length; i++){
    var courseDay = days[i]
    if(courseDay.dayNumber == +dayOfWeek + ((week - 1) * 7)){
      return courseDay.description  || ""
    }
  }
  return ""
}