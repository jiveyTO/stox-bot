var dt = new Date();
console.log(dt); // Gives Tue Mar 22 2016 09:30:00 GMT+0530 (IST)

dt.setTime(dt.getTime()+dt.getTimezoneOffset()*60*1000);
console.log(dt.getTime());
console.log(dt); // Gives Tue Mar 22 2016 04:00:00 GMT+0530 (IST)

var offset = -300; //Timezone offset for EST in minutes.
var estDate = new Date(dt.getTime() + offset*60*1000);
console.log(estDate); //Gives Mon Mar 21 2016 23:00:00 GMT+0530 (IST)

var dt2 = new Date();
console.log(dt2); // Gives Tue Mar 22 2016 09:30:00 GMT+0530 (IST)
var dt3 = new Date();
dt3.setTime(dt3.getTime()-dt3.getTimezoneOffset()*60*1000);
console.log(dt3)
console.log(dt2.getTimezoneOffset())



var dt4 = new Date(Date.parse('2021-05-10 16:00:00'));
console.log(dt4);

var dt5 = new Date();
dt5.setTime(Date.parse('2021-01-09 16:00:00 EST') - dt5.getTimezoneOffset()*60*1000);
console.log(dt5);