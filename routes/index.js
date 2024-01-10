const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const pool = require('../public/javascripts/dbConfig')

router.get('/', function(req, res, next) {
  res.render('index', { title: 'NodeApp' });
});

router.post('/troskovi', async function(req, res, next) {
  const data = req.body;
  const dateFrom = data.dateFrom;
  const dateTo = data.dateTo;

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
        'CALL IzvjestajTroskoviDobavljaca(?, ?)',
        [dateFrom, dateTo]
    );
    connection.release();

    const resultSet = Array.isArray(result) ? result[0] : result;

    const mappedResults = resultSet.map((row) => {
      return {
        id: row.id,
        naziv: row.naziv,
        ukupniTroskovi: parseFloat(row.UkupniTroskovi),
      };
    });

    res.render('troskovi', {
      mappedResults: mappedResults,
    });
  } catch (err) {
    console.error('Greška pri izvršavanju upita u bazu:', err);
    res.status(500).json({ error: 'Interna server greška', details: err.message });
  }
});

router.post('/dnevnice', async function(req, res, next) {
  const data = req.body;
  const id = req.body.id;

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
        'CALL IzracunajDnevnicePoDrzavama(?)',
        [id]
    );
    connection.release();

    const resultSet = Array.isArray(result) ? result[0] : result;

    const mappedResults = resultSet.map((row) => {
      return {
        id: id,
        dnevnice: row.UkupneDnevnice,
      };
    });

    res.render('dnevnice', {
      mappedResults: mappedResults,
    });
  } catch (err) {
    console.error('Greška pri izvršavanju upita u bazu:', err);
    res.status(500).json({ error: 'Interna server greška', details: err.message });
  }
});

router.post('/trosakPutnogNaloga', async function(req, res, next) {
  const id = req.body.id;

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
        'SELECT * FROM TrosakPutnogNaloga WHERE putni_nalog_id = ?',
        [id]
    );
    connection.release();

    if (Array.isArray(result) && result.length > 0) {
      const mappedResults = result.map((row) => ({
        id: row.id,
        putni_nalog_id: row.putni_nalog_id,
        iznos: row.iznos,
        oporezivo: row.oporezivo,
        neoporezivo: row.neoporezivo,
        pdv: row.pdv,
        vrsta_troska_id: row.vrsta_troska_id,
        valuda_id: row.valuda_id,
        vrijeme: row.vrijeme,
        dobavljac_id: row.dobavljac_id,
      }));

      res.render('trosakPutnogNaloga', {
        mappedResults: mappedResults,
      });
    } else {
      res.status(500).json({ error: 'Interna server greška', details: 'Neočekivan format rezultata' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Interna server greška', details: err.message });
  }
});

router.get('/trosakPutnogNaloga', async function(req, res, next) {
  const id = req.query.id;

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
        'SELECT * FROM TrosakPutnogNaloga WHERE putni_nalog_id = ?',
        [id]
    );
    connection.release();

    if (Array.isArray(result) && result.length > 0) {
      const mappedResults = result.map((row) => ({
        id: row.id,
        putni_nalog_id: row.putni_nalog_id,
        iznos: row.iznos,
        oporezivo: row.oporezivo,
        neoporezivo: row.neoporezivo,
        pdv: row.pdv,
        vrsta_troska_id: row.vrsta_troska_id,
        valuda_id: row.valuda_id,
        vrijeme: row.vrijeme,
        dobavljac_id: row.dobavljac_id,
      }));

      res.render('trosakPutnogNaloga', {
        mappedResults: mappedResults,
      });
    } else {
      res.status(500).json({ error: 'Interna server greška', details: 'Neočekivan format rezultata' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Interna server greška', details: err.message });
  }
});

router.delete('/izbrisiTrosakPutnogNaloga', async function(req, res, next) {
  const id = req.body.id;

  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
        'DELETE FROM TrosakPutnogNaloga WHERE putni_nalog_id = ?',
        [id]
    );
    connection.release();

    if (result.affectedRows > 0) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Podaci nisu pronađeni' });
    }
  } catch (err) {
    console.error('Greška pri izvršavanju upita u bazu:', err);
    res.status(500).json({ error: 'Interna server greška', details: err.message });
  }
});

router.post('/unos', async (req, res) => {
  const { vaziOd, naziv, stanje, napomena, drzava, dnevnica } = req.body;

  try {
    const connection = await pool.getConnection();

    await connection.beginTransaction();
    const [zaglavljeResult] = await connection.query(
        'INSERT INTO ZaglavljeCjenovnika (vazi_od, naziv, stanje, napomena) VALUES (?, ?, ?, ?)',
        [vaziOd, naziv, stanje, napomena]
    );

    const zaglavljeId = zaglavljeResult.insertId;

    await connection.query(
        'INSERT INTO Cjenovnik (drzava, dnevnica, zaglavlje_id) VALUES (?, ?, ?)',
        [drzava, dnevnica, zaglavljeId]
    );

    await connection.commit();

    connection.release();

    res.status(201).send({ message: 'Uspješno dodano u bazu!' });
  } catch (error) {
    console.error('Problem sa unosom u bazu:', error);

    if (connection) {
      await connection.rollback();
      connection.release();
    }

    res.status(500).json({ error: 'Interna server greška', details: error.message });
  }
});

module.exports = router;
