import express from "express";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 10000;

const WEBHOOK_SECRET =
  process.env.WEBHOOK_SECRET;

const GITHUB_TOKEN =
  process.env.GITHUB_TOKEN;

const GITHUB_REPOSITORY =
  process.env.GITHUB_REPOSITORY;

app.get("/", (req, res) => {
  res.status(200).send("CATI webhook is running.");
});

app.post("/sanity", async (req, res) => {
  try {
    const receivedSecret =
      req.headers["x-webhook-secret"];

    if (
      !WEBHOOK_SECRET ||
      receivedSecret !== WEBHOOK_SECRET
    ) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    if (
      !GITHUB_TOKEN ||
      !GITHUB_REPOSITORY
    ) {
      console.error(
        "Missing GitHub configuration."
      );

      return res.status(500).json({
        error:
          "Webhook server is not configured.",
      });
    }

    const response =
      await fetch(
        `https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches`,
        {
          method: "POST",

          headers: {
            Accept:
              "application/vnd.github+json",

            Authorization:
              `Bearer ${GITHUB_TOKEN}`,

            "X-GitHub-Api-Version":
              "2022-11-28",

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            event_type:
              "sanity-update",

            client_payload: {
              source: "sanity",
              type:
                req.body?._type ||
                null,
            },
          }),
        }
      );

    if (!response.ok) {
      const body =
        await response.text();

      console.error(
        "GitHub API error:",
        response.status,
        body
      );

      return res.status(502).json({
        error:
          "Could not trigger GitHub Actions.",
      });
    }

    console.log(
      "Triggered GitHub Actions from Sanity."
    );

    return res.status(202).json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error.",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `CATI webhook listening on port ${PORT}`
  );
});