export default function ({
  db,
  router,
  run,
  get,
  all,
  tx,
  id,
  text,
  required,
  fail,
  publish,
}) {
  db.exec(`CREATE TABLE IF NOT EXISTS polls(id TEXT PRIMARY KEY,owner TEXT REFERENCES users(id),question TEXT,open INTEGER DEFAULT 1);
 CREATE TABLE IF NOT EXISTS options(id TEXT PRIMARY KEY,poll TEXT REFERENCES polls(id),label TEXT);
 CREATE TABLE IF NOT EXISTS votes(poll TEXT REFERENCES polls(id),voter TEXT REFERENCES users(id),option TEXT REFERENCES options(id),PRIMARY KEY(poll,voter));`);
  const results = (pid) =>
    all(
      "SELECT o.id,o.label,COUNT(v.voter) count FROM options o LEFT JOIN votes v ON v.option=o.id WHERE o.poll=? GROUP BY o.id",
      pid,
    );
  router.get("/polls", (req, res) =>
    res.json(
      all("SELECT * FROM polls").map((p) => ({
        ...p,
        results: results(p.id),
        myVote:
          get(
            "SELECT option FROM votes WHERE poll=? AND voter=?",
            p.id,
            req.user.id,
          )?.option || null,
      })),
    ),
  );
  router.post("/polls", (req, res) => {
    const question = text(req.body.question),
      options = req.body.options;
    if (!Array.isArray(options) || options.length < 2 || options.length > 6)
      fail(422, "2-6 seçenek gerekli");
    const labels = options.map((x) => text(x, 100));
    if (new Set(labels.map((x) => x.toLowerCase())).size !== labels.length)
      fail(422, "Seçenekler farklı olmalı");
    const pid = id();
    tx(() => {
      run("INSERT INTO polls VALUES(?,?,?,1)", pid, req.user.id, question);
      for (const label of labels)
        run("INSERT INTO options VALUES(?,?,?)", id(), pid, label);
    });
    res.status(201).json({ id: pid });
  });
  router.post("/polls/:id/vote", (req, res) => {
    tx(() => {
      const p = required(get("SELECT * FROM polls WHERE id=?", req.params.id));
      if (!p.open) fail(409, "Oylama kapalı");
      required(
        get(
          "SELECT id FROM options WHERE id=? AND poll=?",
          req.body.option,
          p.id,
        ),
      );
      run(
        "INSERT INTO votes VALUES(?,?,?)",
        p.id,
        req.user.id,
        req.body.option,
      );
    });
    publish("poll", { id: req.params.id });
    res.status(201).json({ ok: true });
  });
  router.patch("/polls/:id", (req, res) => {
    required(
      get(
        "SELECT id FROM polls WHERE id=? AND owner=?",
        req.params.id,
        req.user.id,
      ),
    );
    run(
      "UPDATE polls SET open=? WHERE id=?",
      req.body.open === true ? 1 : 0,
      req.params.id,
    );
    publish("poll", { id: req.params.id });
    res.json({ ok: true });
  });
}
