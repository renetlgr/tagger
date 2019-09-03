const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });
var cloudformation = new AWS.CloudFormation({ apiVersion: '2010-05-15' });

const DATA = require('./data.json');

async function main() {
    let stacks = await getStacks();
    stacks.map(stack=>{
        if (DATA[stack.Cluster]) {
            let tags = keyValueJSONForm(DATA[stack.Cluster].Add);
            console.log('TAGS::',tags)
            updateStacks(stack, tags);
        }
        console.log('STACK::', stack);
    });
}

async function getStacks() {
    try {
        let params = {};
        let stacks = []
        let stacksAWS = await cloudformation.describeStacks(params).promise();
        stacksAWS.Stacks.filter(stackAWS => {
            let splitClusterName = stackAWS.StackName.split('-')[1]; 
            if ((stackAWS.StackName.indexOf("DO") > -1)) {
                stacks.push({
                    Cluster: splitClusterName,
                    StackId: stackAWS.StackId,
                    Status: stackAWS.StackStatus,
                    Tags: stackAWS.Tags
                })
            }
        });
        return stacks;
    } catch (error) {
        console.log("ERROR::", error);
    }
}

async function updateStacks(stack, tags) {
    let params = {
        StackName: stack.StackId,
        Tags: tags,
        TemplateURL: 'https://nice-do-self-service-portal.s3-us-west-2.amazonaws.com/dev/docluster/DOCluster.yaml'
        //TemplateURL: 'file://C:/Users/rene.gutierrez/Downloads/DOCluster.yaml',
    };
    try {
        let result = await cloudformation.updateStack(params).promise();
        console.log('RESULT::', result);
    } catch (error) {
        console.log('ERROR::', error);
    }
}

function keyValueJSONForm(arrayTags) {
    let result = [];
    arrayTags.map(data => {
        var key = Object.keys(data);
        result.push({
            "Key": key[0],
            "Value": data[key[0]]
        })
    });
    return result;
}

main();

/* 
    {"status":"active","minutes":60,"weekday":5,"was":{"start":"8:00 am","end":"12:00 pm","weekdays":[5]}}
 */