import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms',{code:text('code').primaryKey(),hostToken:text('host_token').notNull(),challenge:integer('challenge').notNull().default(0),startedAt:integer('started_at'),createdAt:integer('created_at').notNull()});
export const players = sqliteTable('players',{token:text('token').primaryKey(),roomCode:text('room_code').notNull().references(()=>rooms.code),name:text('name').notNull(),joinedAt:integer('joined_at').notNull(),lastSeen:integer('last_seen').notNull(),score:integer('score').notNull().default(0),submittedAt:integer('submitted_at')});
// Rooms use optimistic revisions so capacity, answers, and host changes are atomic.
export const arenaRooms = sqliteTable('arena_rooms',{code:text('code').primaryKey(),state:text('state').notNull(),revision:integer('revision').notNull().default(0),createdAt:integer('created_at').notNull()});
export const casualRooms=sqliteTable('casual_rooms',{code:text('code').primaryKey(),state:text('state').notNull(),revision:integer('revision').notNull().default(0),createdAt:integer('created_at').notNull()});
