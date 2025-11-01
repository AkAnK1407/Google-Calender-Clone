const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const eventRoutes = require('./routes/eventRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

const app = express();

app.set('trust proxy', 1);

app.use(rateLimiter);
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/events', eventRoutes);
app.use('/api/calendars', calendarRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
