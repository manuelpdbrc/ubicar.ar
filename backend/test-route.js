import express from 'express';
const app = express();
const router = express.Router();

router.post('/visits', (req, res) => {
  res.json({ match: true });
});

app.use('/api', router);
app.use('/api', (req, res) => res.status(404).json({ error: 'not found api' }));
app.use((req, res) => res.send('<!DOCTYPE html>'));

app.listen(3000, () => console.log('test running on 3000'));
