#!/bin/bash
$Env:mongodb_URI = "mongodb+srv://Angelo:angeloadmin@cluster0.7rexm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
echo "connecting to $mongodb_URI"
node app.js