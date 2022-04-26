'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var favoritesSchema = Schema( {
  userId: ObjectId,
  songId: ObjectId,
} );

module.exports = mongoose.model( 'Favorites', favoritesSchema );