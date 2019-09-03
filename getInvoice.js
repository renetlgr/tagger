const moment = require('moment');

const schedule = {
    "start": "08:30 am",
    "end": "08:30 pm",
    "weekdays": [2, 3, 4, 5, 6]
};
const endDate = "2019-12-31";
const PRICE_ON = parseFloat(process.env.DOCLUSTER_PRICE_ON)
const PRICE_OFF = parseFloat(process.env.DOCLUSTER_PRICE_OFF)

function getInvoice(schedule, endDate) {
    let start = moment().startOf('day');
    let end = moment(endDate).endOf('day');
    let timeRange = Math.round(moment.duration(end.diff(start)).asDays());
    let costPerPeriods = {
        "Day": {
            "Time": "1 day.",
            "Total": costPerDay(schedule)
        },
        "Week": {
            "Time": "7 days.",
            "Total": totalCost(schedule, start, 7)
        },
        "Month": {
            "Time": "30 days.",
            "Total": totalCost(schedule, start, 30)
        },
        "UntilEndDate": {
            "time": {
                "Days": timeRange,
                "Weeks": Math.round(timeRange / 7),
                "Months": Math.round(timeRange / 30)
            },
            "Total": totalCost(schedule, start, timeRange)
        }
    }
    console.log('ALL::', costPerPeriods);
    return costPerPeriods;
}

function totalCost(schedule, dateStart, range) {
    let total = 0;
    let costDaySleep = costPerDay();
    let costDayRunning = costPerDay(schedule);
    let weekdaysRangeRepeats = weekdaysRepeats(dateStart, range);
    weekdaysRangeRepeats.map((repeats, index) => {
        var found = schedule.weekdays.find(element => {
            return element === (index + 1);
        });
        if (found) {
            total = total + (repeats * costDayRunning);
        } else {
            total = total + (repeats * costDaySleep);
        }
    });
    return total;

}

function weekdaysRepeats(startDate, range) {
    let weekdays = [0, 0, 0, 0, 0, 0, 0];
    let start = startDate.day();
    for (let i = 0; i < range; i++) {
        if (start > 6) {
            start = 0;
        }
        weekdays[start]++
        start++;
    }
    return weekdays;
}

function costPerDay(schedule) {
    let cost = 0;
    let sleepTime = 24;
    if (schedule) {
        let runningTime = workTime(schedule.start, schedule.end);
        sleepTime -= runningTime;
        cost = (runningTime * PRICE_ON) + (sleepTime * PRICE_OFF);
        console.log('ON',cost);
    } else {
        cost = sleepTime * PRICE_OFF;
        console.log('OFF',cost);
    }
    cost = Math.round(cost * 100) / 100;
    return cost;
}

function workTime(startTime, endTime) {
    let start = moment.utc(startTime, "HH:mm A");
    let end = moment.utc(endTime, "HH:mm:ss A");
    let diffTime = moment.duration(end.diff(start)).asHours();
    diffTime = Math.round(diffTime * 100) / 100;
    if ((diffTime % 0.5) !== 0) {
        diffTime += 0.02;
    }
    return diffTime;
}

getInvoice(schedule, endDate);