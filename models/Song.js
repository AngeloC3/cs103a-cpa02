'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const Mixed = Schema.Types.Mixed;

var songSchema = Schema( {
    artists: [String],
    artistStr: String,
    title: String,
    popularity: Number,
    album: String,
    genres: [String],
    genreStr: String,
} );

module.exports = mongoose.model( 'Song', songSchema );
