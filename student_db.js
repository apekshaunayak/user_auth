const { MongoClient } = require("mongodb");

const url = "mongodb://apekshanayak02_db_user:Apekshanayak@ac-v44wvbp-shard-00-00.lmwpsw7.mongodb.net:27017,ac-v44wvbp-shard-00-01.lmwpsw7.mongodb.net:27017,ac-v44wvbp-shard-00-02.lmwpsw7.mongodb.net:27017/?ssl=true&replicaSet=atlas-jf9h55-shard-0&authSource=admin";


async function main() {
    const client = new MongoClient(url);

    try {
        await client.connect();

        console.log("Connected to MongoDB");

        const db = client.db("college");
        console.log("Connected to college database");

        const students = db.collection("students");

        const result = await students.insertMany([
            {
                fullname: "Anu",
                usn: "svm101",
                branch: "AIML",
                cgpa: 9.6
            },
            {
                fullname: "Ananya",
                usn: "svm102",
                branch: "CSE",
                cgpa: 9.2
            },
            {
                fullname: "spoo",
                usn: "svm103",
                branch: "ISE",
                cgpa: 8.9
            },
            {
                fullname: "Priya",
                usn: "svm104",
                branch: "AIML",
                cgpa: 9.4
            },
            {
                fullname: "Apu",
                usn: "svm105",
                branch: "ECE",
                cgpa: 8.7
            }
        ]);

        console.log(result.insertedCount + " students inserted successfully");

        const updateResult = await students.updateOne(
            { usn: "svm101" },
            { $set: { cgpa: 9.8 } }
        );

        console.log(updateResult.modifiedCount + " student updated successfully");

        const rows = await students.find({}).toArray();

        console.log(rows);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
}

main();