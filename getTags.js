const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });
const EC2 = new AWS.EC2({ apiVersion: '2016-11-15' });

let stacks = [];
let stacksToCSV = [];

async function main() {
    stacks = await getInstances();
    stacks.map(stack => {
        stack.Tags.sort(function (a, b) {
            if (a.Key > b.Key) {
                return 1;
            }
            if (a.Key < b.Key) {
                return -1;
            }
            return 0;
        });
        getRowHeader(stack);
        integrator(stack);
    });
    stacksToCSV.map(row => {
        console.log(returnText(row));
    })
}

async function getInstances() {
    let tagNames = ["Cluster"];
    let tagValues = ["DO*,do*"];
    var filters = [];
    tagNames.map((tag, index) => {
        try {
            var newTagFilter = {
                Name: "tag:" + tag,
                Values: tagValues[index].split(',')
            }
            filters.push(newTagFilter);
        } catch (err) { }
    });
    var params = {};
    if (filters.length > 0) { params.Filters = filters }
    let result = await EC2.describeInstances(params).promise();
    result = orderData(result.Reservations);
    return result;
}

function orderData(ArrayInstances) {
    let result = [];
    ArrayInstances.map(({ Instances }) => {
        if (Instances[0].State.Name !== 'terminated') {
            result.push({
                "InstanceId": Instances[0].InstanceId,
                "Tags": Instances[0].Tags
            });
        }
    });
    return result;
}

function integrator(stack) {
    let row = [stack.InstanceId];
    let headerRowSize = stacksToCSV[0].length;
    row = fillWithSpaces(row,headerRowSize)
    stack.Tags.map(tag => {
        let position = getHeaderPosition(stacksToCSV[0], tag.Key);
        let value = '"' + tag.Value.replace(/\"/g,'""') + '"';
        if (position === -1) {
            row.push(value);
        } else {
            row[position] = value;
        }
    });
    stacksToCSV.push(row);
}

function getRowHeader(stack) {
    if (stacksToCSV.length === 0) {
        stacksToCSV.push([]);
    }
    let header = stacksToCSV[0];
    if (header.length === 0) {
        header.push('Instance Id');
    }
    stack.Tags.map(tag => {
        let tagExist = header.find(head => { return head === tag.Key });
        if (!tagExist) {
            header.push(tag.Key);
        }
    });
    stacksToCSV[0] = header
}

function getHeaderPosition(rowHeader, key) {
    let result = -1;
    for (let i = 0; i < rowHeader.length; i++) {
        const element = rowHeader[i];
        if (element === key) {
            result = i;
            break;
        }
    }
    return result;
}

function fillWithSpaces(row, rowSize){
    for (let i = 1; i < rowSize; i++) {
        row.push(' ');        
    }
    return row;
}

function returnText (row){
    let text = '';
    row.map(item => text += item + ',');
    return text;
}

main();