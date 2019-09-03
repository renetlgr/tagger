const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });
const EC2 = new AWS.EC2({ apiVersion: '2016-11-15' });

const DATA = require('./data.json');
let stacks = [];
const IGNORE_REMOVE_VALUE = true;

async function main() {
    stacks = await getStacks();
    let date = new Date().toDateString();
    console.log('Executed,', date);
    console.log('CLUSTERS,', listOfStacks(stacks));
    console.log();
    spliter(stacks);
}

async function getStacks() {
    let instances = await getInstances();
    instances.map(instance => {
        if (stacks.length === 0) {
            stacks.push({
                "Cluster": instance.Cluster,
                "instances": [instance.InstanceId],
                "Tags": instance.Tags
            });
        } else {
            var flag = false;
            stacks.forEach(stack => {
                if (stack.Cluster === instance.Cluster && !flag) {
                    stack.instances.push(instance.InstanceId);
                    flag = true;
                }
            });
            if (!flag) {
                stacks.push({
                    "Cluster": instance.Cluster,
                    "instances": [instance.InstanceId],
                    "Tags": instance.Tags
                })
            }
        }
    });
    return stacks;
}

function listOfStacks(stacks) {
    let list = '[ '
    // let list = [];
    stacks.map(stack => {
        list += stack.Cluster + ' ';
    //     list.push(stack.Cluster);
    });
    list += ']';
    return list;
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
                "Cluster": Instances[0].Tags.find((element) => element.Key === "Cluster").Value,
                "InstanceId": Instances[0].InstanceId,
                "Tags": Instances[0].Tags
            });
        }
    });
    result.sort(function (a, b) {
        if (a.Cluster > b.Cluster) {
            return 1;
        }
        if (a.Cluster < b.Cluster) {
            return -1;
        }
        return 0;
    });
    return result;
}

function spliter(stacks) {
    console.log('CLUSTER, CONFIGURED, ACTION, TAG, VALUE');
    stacks.map(stack => {
        if (DATA[stack.Cluster]) {
            let remove = keyValueJSONForm(DATA[stack.Cluster].Remove , IGNORE_REMOVE_VALUE);
            let add = keyValueJSONForm(DATA[stack.Cluster].Add);
            if (remove.length !== 0) {
                // console.log('STACKS::',stack);
                remove.map(tag => {
                    console.log(`${stack.Cluster},${true},Remove,${tag.Key}`);
                });
                untagger(stack.instances, remove);
            } else {
                console.log(`${stack.Cluster},${true},Remove,None`);
            }
            if (add.length !== 0) {
                add.map(tag => {
                    console.log(`${stack.Cluster},${true},Add,${tag.Key},${tag.Value}`);
                });
                tagger(stack.instances, add);
            } else {
                console.log(`${stack.Cluster},${true},Add,None,None`);
            }
        } else {
            console.log(`${stack.Cluster},${false},Add`);
            console.log(`${stack.Cluster},${false},Remove`);

        }
    });
}

async function tagger(instances, tagsToAdd) {
    try {
        var params = {
            "Resources": instances,
            "Tags": tagsToAdd
        };
        let result = await EC2.createTags(params).promise();
        console.log('RESULT::', result);
    } catch (error) {
        console.log('ERROR::', error);
    }
}

async function untagger(instances, tagsToRemove) {
    try {
        var params = {
            "Resources": instances,
            "Tags": tagsToRemove
        };
        let result = await EC2.deleteTags(params).promise();
        console.log('RESULT::', result);
    } catch (error) {
        console.log('ERROR::', error);
    }
}

function keyValueJSONForm(arrayTags, remove) {
    let result = [];
    arrayTags.map(data => {
        var key = Object.keys(data);
        if (remove) {
            result.push({
                "Key": key[0],
            });
        } else {
            result.push({
                "Key": key[0],
                "Value": data[key[0]]
            });
        }
    });
    return result;
}

module.exports = {
    getInstances,
}

// getInstances();
main();