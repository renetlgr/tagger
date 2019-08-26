const Instances = require('./getInstances');
// const taggerData = require('./tagger.json');

async function arrayInstances() {
    let stacks = await Instances.getInstances();
    let instances = stacks.map( stack => {
        console.log('INTANCES', stack);
    });
    // Instances.tagger(taggerData, stacks)
}



arrayInstances();