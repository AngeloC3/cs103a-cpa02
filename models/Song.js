'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const Mixed = Schema.Types.Mixed;

var songSchema = Schema( {
    artist: String,
    featuredArtists: [String],
    name: String,
    length: Number,
    album: String,
    favorited: Boolean,
} );

module.exports = mongoose.model( 'Song', songSchema );
