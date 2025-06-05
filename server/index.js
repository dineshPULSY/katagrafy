process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Initialize Stripe SDK
require("./utils/logger")();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { reqBody } = require("./utils/http");
const { systemEndpoints } = require("./endpoints/system");
const { workspaceEndpoints } = require("./endpoints/workspaces");
const { chatEndpoints } = require("./endpoints/chat");
const { embeddedEndpoints } = require("./endpoints/embed");
const { embedManagementEndpoints } = require("./endpoints/embedManagement");
const { getVectorDbClass } = require("./utils/helpers");
const { adminEndpoints } = require("./endpoints/admin");
const { inviteEndpoints } = require("./endpoints/invite");
const { utilEndpoints } = require("./endpoints/utils");
const { developerEndpoints } = require("./endpoints/api");
const { extensionEndpoints } = require("./endpoints/extensions");
const { bootHTTP, bootSSL } = require("./utils/boot");
const { workspaceThreadEndpoints } = require("./endpoints/workspaceThreads");
const { documentEndpoints } = require("./endpoints/document");
const { agentWebsocket } = require("./endpoints/agentWebsocket");
const { experimentalEndpoints } = require("./endpoints/experimental");
const { browserExtensionEndpoints } = require("./endpoints/browserExtension");
const { communityHubEndpoints } = require("./endpoints/communityHub");
const { agentFlowEndpoints } = require("./endpoints/agentFlows");
const { mcpServersEndpoints } = require("./endpoints/mcpServers");
const { ClerkExpressRequireAuth } = require("@clerk/clerk-sdk-node");
const app = express();
const apiRouter = express.Router();
const stripeRouter = express.Router(); // New Stripe router
const FILE_LIMIT = "3GB";

app.use(cors({ origin: true }));
app.use(bodyParser.text({ limit: FILE_LIMIT }));
app.use(bodyParser.json({ limit: FILE_LIMIT }));
app.use(
  bodyParser.urlencoded({
    limit: FILE_LIMIT,
    extended: true,
  })
);

if (!!process.env.ENABLE_HTTPS) {
  bootSSL(app, process.env.SERVER_PORT || 3001);
} else {
  require("@mintplex-labs/express-ws").default(app); // load WebSockets in non-SSL mode.
}

app.use("/api", apiRouter);
systemEndpoints(apiRouter);
extensionEndpoints(apiRouter);
workspaceEndpoints(apiRouter);
workspaceThreadEndpoints(apiRouter);
chatEndpoints(apiRouter);
adminEndpoints(apiRouter);
inviteEndpoints(apiRouter);
embedManagementEndpoints(apiRouter);
utilEndpoints(apiRouter);
documentEndpoints(apiRouter);
agentWebsocket(apiRouter);
experimentalEndpoints(apiRouter);
developerEndpoints(app, apiRouter);
communityHubEndpoints(apiRouter);
agentFlowEndpoints(apiRouter);
mcpServersEndpoints(apiRouter);

// Externally facing embedder endpoints
embeddedEndpoints(apiRouter);

// Externally facing browser extension endpoints
browserExtensionEndpoints(apiRouter);

// Apply Clerk authentication to Stripe routes
// User info will be on req.auth
stripeRouter.use(ClerkExpressRequireAuth({
  // Add options here if needed, like onError for custom error handling
}));

// Stripe routes
stripeRouter.post('/create-checkout-session', async (req, res) => {
  try {
    const { userId } = req.auth; // From Clerk authentication
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required.' });
    }

    // TODO: Later, retrieve stripeCustomerId from your DB if user has one
    // const userRecord = await db.users.find({ clerkId: userId });
    // const stripeCustomerId = userRecord?.stripeCustomerId;

    const sessionParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      client_reference_id: userId, // Pass Clerk userId here
      // ...(stripeCustomerId ? { customer: stripeCustomerId } : {}), // Uncomment if/when you retrieve existing customer ID
    };

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);
    res.json({ id: checkoutSession.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

stripeRouter.post('/create-portal-session', async (req, res) => {
  try {
    const { userId } = req.auth;

    // TODO: Retrieve stripeCustomerId from your database based on userId
    // This is a placeholder. In a real app, you'd query your database:
    // const userRecord = await db.users.findUnique({ where: { clerkId: userId } });
    // if (!userRecord || !userRecord.stripeCustomerId) {
    //   return res.status(404).json({ error: 'Stripe customer ID not found for this user.' });
    // }
    // const stripeCustomerId = userRecord.stripeCustomerId;

    // For now, we can't proceed without a stripeCustomerId.
    // This endpoint will become fully functional after webhooks store the customer ID.
    // So, let's return a placeholder or an error indicating it's not ready.
    // Option 1: Return an error for now
      return res.status(501).json({ error: 'Customer portal not yet implemented. Stripe Customer ID is needed.' });

    // Option 2: (If you had a placeholder stripeCustomerId for testing)
    // const stripeCustomerId = "cus_placeholder"; // Replace with actual logic later

    // const portalSession = await stripe.billingPortal.sessions.create({
    //   customer: stripeCustomerId,
    //   return_url: `${process.env.FRONTEND_URL}/dashboard`,
    // });
    // res.json({ url: portalSession.url });

  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session.' });
  }
});

// Mount the stripeRouter under the main apiRouter
apiRouter.use('/stripe', stripeRouter);

// Stripe Webhook Handler - must be on apiRouter to be under /api, and use express.raw for signature verification
apiRouter.post('/stripe/webhooks', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.sendStatus(400);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('CheckoutSession completed:', session.id);
      const clerkUserId = session.client_reference_id; // Clerk User ID
      const stripeCustomerId = session.customer;
      const subscriptionId = session.subscription;
      const planPriceId = session.display_items && session.display_items.length > 0 ? session.display_items[0].plan.id : null; // or session.line_items

      if (!clerkUserId || !stripeCustomerId || !subscriptionId) {
        console.error('Missing critical IDs in checkout.session.completed webhook', { clerkUserId, stripeCustomerId, subscriptionId });
        break;
      }

      console.log(`User ${clerkUserId} subscribed with Stripe Customer ID ${stripeCustomerId} and Subscription ID ${subscriptionId}. Plan Price ID: ${planPriceId}`);

      // TODO: Save/update user in DB:
      // - clerkUserId
      // - stripeCustomerId
      // - stripeSubscriptionId
      // - currentPlanPriceId (to identify plan)
      // - subscriptionStatus: session.payment_status === 'paid' ? 'active' : 'incomplete' (or based on subscription object)
      // - currentPeriodEnd: (fetch subscription from Stripe to get this if needed)
      // - quota: (set based on planPriceId)

      // Add Clerk User ID to Stripe Customer Metadata
      try {
        await stripe.customers.update(stripeCustomerId, {
          metadata: { clerkUserId: clerkUserId },
        });
        console.log(`Updated Stripe Customer ${stripeCustomerId} metadata with clerkUserId ${clerkUserId}`);
      } catch (error) {
        console.error('Failed to update Stripe customer metadata:', error);
      }
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('Invoice payment succeeded for:', invoice.customer);
      // TODO: Update subscription period & reset/update prompt quota in DB
      // - Find user by invoice.customer (stripeCustomerId)
      // - Update current_period_end based on invoice.lines.data[0].period.end
      // - Reset prompt usage count
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object;
      console.log('Subscription updated:', subscriptionUpdated.id, 'Status:', subscriptionUpdated.status);
      // TODO: Update subscription status, plan, quota in DB
      // - Find user by subscriptionUpdated.customer
      // - Update plan if subscriptionUpdated.items.data[0].price.id changed
      // - Update status: subscriptionUpdated.status (e.g., 'active', 'past_due', 'canceled')
      // - Update current_period_end: subscriptionUpdated.current_period_end
      break;

    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object;
      console.log('Subscription deleted:', subscriptionDeleted.id);
      // TODO: Update subscription status to 'canceled' or similar in DB
      // - Find user by subscriptionDeleted.customer
      // - Clear subscription details or mark as canceled, potentially set an end_date for access
      break;

    // ... handle other event types as needed

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.sendStatus(200);
});

if (process.env.NODE_ENV !== "development") {
  const { MetaGenerator } = require("./utils/boot/MetaGenerator");
  const IndexPage = new MetaGenerator();

  app.use(
    express.static(path.resolve(__dirname, "public"), {
      extensions: ["js"],
      setHeaders: (res) => {
        // Disable I-framing of entire site UI
        res.removeHeader("X-Powered-By");
        res.setHeader("X-Frame-Options", "DENY");
      },
    })
  );

  app.use("/", function (_, response) {
    IndexPage.generate(response);
    return;
  });

  app.get("/robots.txt", function (_, response) {
    response.type("text/plain");
    response.send("User-agent: *\nDisallow: /").end();
  });
} else {
  // Debug route for development connections to vectorDBs
  apiRouter.post("/v/:command", async (request, response) => {
    try {
      const VectorDb = getVectorDbClass();
      const { command } = request.params;
      if (!Object.getOwnPropertyNames(VectorDb).includes(command)) {
        response.status(500).json({
          message: "invalid interface command",
          commands: Object.getOwnPropertyNames(VectorDb),
        });
        return;
      }

      try {
        const body = reqBody(request);
        const resBody = await VectorDb[command](body);
        response.status(200).json({ ...resBody });
      } catch (e) {
        // console.error(e)
        console.error(JSON.stringify(e));
        response.status(500).json({ error: e.message });
      }
      return;
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });
}

app.all("*", function (_, response) {
  response.sendStatus(404);
});

// In non-https mode we need to boot at the end since the server has not yet
// started and is `.listen`ing.
if (!process.env.ENABLE_HTTPS) bootHTTP(app, process.env.SERVER_PORT || 3001);
