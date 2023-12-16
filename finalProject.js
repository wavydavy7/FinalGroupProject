const express = require("express"); 
const app = express(); 
const path = require("path");
const bodyParser = require("body-parser");
const fs = require('fs');

process.stdin.setEncoding("utf8");
if (process.argv.length != 3) {
    process.stdout.write(`Add a port number`);
    process.exit(1);
}
const portNumber = process.argv[2];

//write on the terminal:
process.stdout.write(`Web server started and running at http://localhost:${portNumber}\n`);
process.stdout.write(`Stop to shutdown the server: `);

//exits on reading "stop"
// process.stdin.on("readable", function () {
//     let userInput = process.stdin.read();
//     if (userInput !== null) {
//         let command = userInput.trim();
//         if (command === "stop") {
//             console.log("Shutting down the server");
//             process.exit(0);  /* exiting */
//         }
//     } else {
//         console.log(`Invalid command: ${command}`);
//     }
// });

require("dotenv").config({ path: path.resolve(__dirname, '.env') });
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

const uri = `mongodb+srv://${userName}:${password}@cluster0.hcmx8j0.mongodb.net/?retryWrites=true&w=majority`;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


app.use(bodyParser.urlencoded({extended:false}));

/* directory where templates will reside */
app.set("views", path.resolve(__dirname, "templates"));

/* view/templating engine */
app.set("view engine", "ejs");

app.get("/", (request, response) => { 
    response.render("index");
});

app.post("/", (request, response) => {
    word = request.body.engWord;
    newWord = request.body.spWord;

    insertWord({Word: word, NewWord: newWord});

    //creates the array of information for the processApplication endpoint
    const variables = {
        Word: word,
        NewWord: newWord
    };

    response.render("receipt", variables);
});

app.get("/lookup", (request, response) => { 
    response.render("lookup");
});

app.post("/lookup", (request, response) => { 

        //looks up an applicant using email. If applicant exists, returns their info. If not, returns NONE for all parts.
        lookUpWord(request.body.lookup).then(result => {
            if(result) {
                return {Word: result.Word, NewWord: result.NewWord};                
            } else {
                return{Word: "NONE", NewWord: "NONE"};
            }
        }).then(variables => response.render("processLookup", variables));
});


app.get("/deleteAll", (request, response) => {
    response.render("deleteAll");
})

app.post("/deleteAll", (request, response) => {
    clearDB().then(result => {
        response.render("processDeleteAll", {numRemoved: result})
    });
})

async function clearDB() {
    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
        const numDeleted = await result.deletedCount;
        return numDeleted;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}




// Inserts new word into the database
async function insertWord(inputWord) {
    try {
        await client.connect();
        
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(inputWord);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function lookUpWord(engWord) {
    try {
        await client.connect();
        let filter = {Word: engWord}
        const result = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .findOne(filter);                        
        if (result) {
            return result;
        } else {
            console.log(`No info found with word ${engWord}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}





app.listen(portNumber);



//Hey Davy! I made some changes to the plan just to make the app more intuitive and to let me not pay for a rapid tranlation api. I'll describe them below to catch you up
//  1. Instead of using the rapid translate multi traduction API that we looked at earlier, I ended up using the google translate api because it was simpler
//  2. The Translator is now a separate thing from the form... so we will have the user input an english word, translate it using the api, and then copy paste into the form
//  3. I also added a lookup function and a clear database function (so that its easier for the grader to know that we used mongoDB correctly)
//  4. The receipt page that I was talking about no longer displays the entire database because I added a lookup function. It will only display the specific entry that was just added.
//I'm really sorry that I was late on giving this to you, I got really busy with drill and other assignments. Let me know if you would like anything changed!