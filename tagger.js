const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });
const EC2 = new AWS.EC2({ apiVersion: '2016-11-15' });

const DATA = require('./data.json');
let stacks = [];

async function main() {
    stacks = await getStacks();
    console.log();
    console.log('CLUSTERS', listOfStacks(stacks));
    console.log('----------------------------------------------------------------------------------------');
    show(stacks);
    console.log('DONE!');
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
    let list = [];
    stacks.map(stack => {
        list.push(stack.Cluster);
    });
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

function show(stacks) {
    stacks.map(stack => {
        if (DATA[stack.Cluster]) {
            console.log('CLUSTER', stack.Cluster);
            console.log('   Remove: ');
            if (DATA[stack.Cluster].Remove.length !== 0) {
                DATA[stack.Cluster].Remove.map(tag => {
                    console.log('           -', tag);
                });
            } else {
                console.log('           - Nothing to REMOVE');
            }
            console.log('   Add: ');
            if (DATA[stack.Cluster].Add.length !== 0) {
                DATA[stack.Cluster].Add.map(tag => {
                    console.log('           -', tag);
                });
            } else {
                console.log('           - Nothing to ADD');
            }
            console.log('----------------------------------------------------------------------------------------');
        } else {
            console.log('Nothing to change for ', stack.Cluster);
            console.log('----------------------------------------------------------------------------------------');

        }
    });
}

// function splitInstances(instances) {
//     let dataKeys = Object.keys(DATA);
//     let remove;
//     let add;
//     let instance;
//     dataKeys.map(key => {
//         remove = keyValueJSONForm(DATA[key].Remove);
//         add = keyValueJSONForm(DATA[key].Add);
//         instance = getInstancesToUpdateTags(key, instances);
//         untagger(instance, remove);
//         tagger(instance, add);
//     });
// }

// function getInstancesToUpdateTags(key, instances) {
//     let result = [];
//     instances.map(instance => {
//         if (instance.Cluster === key) {
//             result.push(instance.InstanceId);
//         }
//     });
//     return result;
// }

// async function tagger(instances, tagsToAdd) {

//     try {
//         var params = {
//             "Resources": instances,
//             "Tags": tagsToAdd
//         };
//         let result = await EC2.createTags(params).promise();
//         console.log('RESULT::', result);
//     } catch (error) {
//         console.log('ERROR::', error);

//     }
// }

// async function untagger(instances, tagsToRemove) {
//     try {
//         var params = {
//             "Resources": instances,
//             "Tags": tagsToRemove
//         };
//         let result = await EC2.deleteTags(params).promise();
//         console.log('RESULT::', result);
//     } catch (error) {
//         console.log('ERROR::', error);
//     }
// }

// function keyValueJSONForm(arrayTags) {
//     let result = [];
//     arrayTags.map(data => {
//         var key = Object.keys(data);
//         result.push({
//             "Key": key[0],
//             "Value": data[key[0]]
//         })
//     });
//     return result;
// }

module.exports = {
    getInstances,
}

// getInstances();
main();