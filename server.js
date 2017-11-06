import express from 'express'
import axios from 'axios'
import assert from 'assert'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
dotenv.config({silent: true});
import mongoose from 'mongoose'
import mongodb from 'mongodb'
const MongoClient = mongodb.MongoClient;
const DB_URL = process.env.MONGO_HOST;

const app = express();

const server = app.listen(process.env.PORT || 7000, () => {
    console.log('listening on port 7000');
});

const io = require('socket.io')(server);

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('static'));

MongoClient.connect(DB_URL, (err, db) => {
    assert.equal(null, err);
    console.log('Connected through MongoClient');
    db.close();
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('init', () => {
        MongoClient.connect(DB_URL, (err, db) => {
            assert.equal(null, err);
            db.collection('stocks').find().toArray((error, response) => {
                if(!err) {
                    let data = [];
                    socket.emit('inform-length', response.length);
                    for(let i = 0; i < response.length; i++) {data[i] = response[i].symbol}
                    data.map((ticker) => {
                        axios.get('https://www.quandl.com/api/v3/datasets/WIKI/' + ticker + '.json?api_key=' + process.env.QUANDL_KEY).then((resonse) => {
                            socket.emit('init-stock', response.data);
                        }).catch(err => console.log(err));
                    });
                    db.close();
                }
            });
        });
    });

    socket.on('add', (stock) => {
        console.log('Fetching price data for ${stock} from Quandl API');

        axios.get('https://www.quandl.com/api/v3/datasets/WIKI/' + stock + '.json?api_key=' + process.env.QUANDL_KEY).then((response) => {
            socket.emit('stock-added', response.data);
            socket.broadcast.emit('stock-added', response.data);

            MongoClient.connect(process.env.MONGO_HOST, (err, db) => {
                assert.equal(null, err);
                console.log('Inserting ${stock} into database');
                db.collection('stocks').insertOne({symbol: stock});
                db.close();
            });
        }).catch((err) => {
            socket.emit('lookup-error', 'This symbol could not be found!');
        });
    });

    socket.on('remove-stock', (symbol) => {
        console.log('Received remove request for', symbol);
        MongoClient.connect(DB_URL, (err, db) => {
            assert.equal(null, err);
            db.collection('stocks').remove(
                {symbol: symbol},
                {justOne: true}
            );
            socket.broadcast.emit('stock-removed', symbol);
        });
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});