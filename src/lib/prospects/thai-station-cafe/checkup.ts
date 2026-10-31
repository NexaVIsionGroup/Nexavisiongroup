import type { AccessField, Field, Option, Template } from "@/lib/questionnaires/types";

// Thai Station Cafe (Babylon, NY): prospect check-up.
// Opens on a briefing of what we found from public information (audit
// 2026-10-31, C:\websites\thai-station-cafe\HANDOVER.md), then asks for
// read-only access and a few business questions so we can write a proposal.

const US = "admin@nexavisiongroup.com";

const opts = (...labels: string[]): Option[] =>
  labels.map((l) => ({ value: l.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""), label: l }));

const access = (f: Omit<AccessField, "type" | "label"> & { label?: string }): AccessField => ({
  type: "access",
  label: f.label || f.platform,
  ...f,
});

const readOnly: Field = {
  type: "info",
  id: "ro_note",
  tone: "privacy",
  label:
    "We only look. Nothing gets changed on any of these until you approve a proposal. Logins you type here are encrypted, and you can change your passwords or remove us any time.",
};

export const thaiStation: Template = {
  id: "thai-station-cafe",
  name: "Restaurant Growth Check-up · Thai Station Cafe",
  description: "Findings briefing + read-only access + business questions for Thai Station Cafe.",
  kind: "prospect",
  welcome: {
    heading: "Let's get you set up",
    body: ["A few quick steps so we can look at your real numbers and send you a proposal."],
  },
  brief: {
    business: "Thai Station Cafe",
    place: "Babylon, NY",
    accent: "#C47A2C",
    hello: "Hi there",
    headline: "599 people say your food is great.",
    headlineAccent: "Let's make ordering it just as good.",
    heroImage: "/p/thai-station/hero.webp",
    seamImage: "/p/thai-station/meal.webp",
    zone: {
      radii: [3, 5, 7],
      defaultRadius: 5,
      water: "Great South Bay",
      // approximate miles from 128 N Carll Ave (x = east, y = north)
      towns: [
        { name: "North Babylon", x: 0.4, y: 2.3 },
        { name: "West Babylon", x: -2.3, y: 1.1 },
        { name: "West Islip", x: 2.7, y: 0.7 },
        { name: "Lindenhurst", x: -4.1, y: 0.4 },
        { name: "Wyandanch", x: -1.2, y: 5.0 },
        { name: "Deer Park", x: 0.9, y: 5.6 },
        { name: "Bay Shore", x: 6.2, y: 0.9 },
        { name: "Amityville", x: -6.2, y: -0.5 },
      ],
    },
    lead:
      "We're NexaVision Group, the team behind Den Chai's website and ordering. We took a careful look at everything a customer sees when they try to order from you online. Here's what we found, and how we think we can save you money and bring in more orders.",
    doors: {
      names: ["DoorDash", "Online Ordering by DoorDash", "Seamless", "Grubhub", "Uber Eats", "Grubhub Direct", "thefastbite.com", "Orderspoon", "Postmates"],
      own: "thefastbite.com",
      caption: "Every way Google offers to order from you today, in the order Google shows them.",
    },
    facts: [
      { value: "4.7★", label: "599 Google reviews" },
      { value: "9", label: "ways to order on Google" },
      { value: "3", label: "separate ordering websites" },
      { value: "7%", label: "taken from your own online orders" },
    ],
    findings: [
      {
        id: "google",
        stat: "#7",
        statLabel: "where your own ordering site sits",
        title: "Google sends your customers to DoorDash first",
        tone: "warn",
        body: [
          "When someone taps “Order online” on your Google listing, they see 9 choices. DoorDash is at the top with a “Preferred by business” badge. Your own ordering site is 7th.",
          "Most people tap the first option, and every app order costs you a commission.",
        ],
        fix: "Make your own ordering site the preferred choice on Google, so pickup orders come straight to you. The apps can stay for delivery if you want the reach.",
        image: { src: "/p/thai-station/google-order.webp", alt: "Google 'Order online' list for Thai Station Cafe with DoorDash marked Preferred by business", caption: "Your Google “Order online” list, Oct 31" },
      },
      {
        id: "fee",
        stat: "7%",
        statLabel: "of every online order",
        title: "You pay 7% on orders from your own website",
        tone: "money",
        body: [
          "Orders from the “Order Online” button on your website go through The Fast Bite, and 7% of every one of those sales goes to the reseller, on top of normal card fees.",
          "The Fast Bite's own website lists plans from $99 a month and calls them commission-free, so the 7% is the reseller's charge, not the platform's.",
        ],
        fix: "Order through your own system connected to your Clover. You pay normal card processing and nothing else per order.",
        image: { src: "/p/thai-station/fastbite.webp", alt: "Thai Station Cafe ordering page on The Fast Bite", caption: "thaistationcafe.thefastbite.com" },
      },
      {
        id: "sites",
        stat: "3",
        statLabel: "ordering websites",
        title: "Three websites sell your food, at different prices",
        tone: "warn",
        body: [
          "Besides The Fast Bite, there's a Menufy site at thaistationcafebabylonny.com that adds 4% to every price (a $15.00 dish shows as $15.60) and was turned off for orders when we checked. There's a third ordering page on gotoeat.net.",
          "Different menus, prices and hours in different places confuse customers and confuse Google.",
        ],
        fix: "One menu, one set of prices, one ordering site. We hear Menufy isn't your favorite anyway, so we'd point that address at your new site and close it out for you.",
        image: { src: "/p/thai-station/menufy.webp", alt: "Menufy site for Thai Station Cafe showing it is not accepting online orders", caption: "thaistationcafebabylonny.com (Menufy)" },
      },
      {
        id: "menu",
        stat: "$0",
        statLabel: "prices on your menu page",
        title: "Your website menu has no prices",
        tone: "info",
        body: [
          "Google's “Menu” link sends people to the menu page on thaistationcafe.com, which lists dishes but no prices and no photos. Hungry people want to see both before they order.",
        ],
        fix: "A beautiful menu with real prices and photos that stays in sync with Clover, so you change a price once and it's right everywhere.",
        image: { src: "/p/thai-station/menu-no-prices.webp", alt: "Thai Station Cafe website menu page showing dishes without prices", caption: "thaistationcafe.com/menu" },
      },
      {
        id: "hours",
        stat: "3",
        statLabel: "different sets of hours online",
        title: "Your hours don't match from place to place",
        tone: "info",
        body: [
          "Your website says 12–9:30 PM every day. Menufy says Noon–9:00 PM. Other listings say 9:00 PM Monday through Thursday. When hours disagree, Google trusts your listing less and customers show up to a closed kitchen, or don't show up at all.",
        ],
        fix: "Set your hours once in your own admin app, including holiday closures, and have them update everywhere.",
        compare: [
          { source: "Your website", value: "12:00–9:30 PM daily" },
          { source: "Menufy", value: "Noon–9:00 PM", odd: true },
          { source: "Other listings", value: "Mon–Thu until 9:00 PM", odd: true },
        ],
      },
    ],
    calculator: {
      resellerPct: 7,
      appPct: 25,
      note: "Estimates only. Card processing applies either way and isn't counted here. Your real numbers come from the reports you share below.",
    },
    features: [
      { icon: "ShoppingBag", image: "/p/thai-station/build-1.webp", title: "Your own ordering site", body: "Photos, real prices, pickup times. Orders go straight into your Clover. No per-order fee." },
      { icon: "Bike", image: "/p/thai-station/build-2.webp", title: "Your drivers, your zone", body: "Delivery inside a 5–7 mile circle you control, with your own fees, minimums and hours." },
      { icon: "MapPin", image: "/p/thai-station/build-3.webp", title: "Google sends orders to you", body: "Your site becomes the preferred “Order online” choice, and your hours and menu stay correct." },
      { icon: "Gift", image: "/p/thai-station/build-4.webp", title: "Promos & loyalty you own", body: "Coupons, rewards and a customer list that belongs to you, not an app." },
      { icon: "Smartphone", image: "/p/thai-station/build-5.webp", title: "Run it from your phone", body: "Change a price, mark a dish sold out, close for a holiday, add photos, all in seconds." },
      { icon: "TrendingUp", image: "/p/thai-station/build-6.webp", title: "We handle the marketing", body: "Google posts, Yelp, photos and promotions, so you can stay in the kitchen." },
    ],
    proof: { text: "It's the same system we built and run for Den Chai.", url: "https://den-chai.com", label: "See den-chai.com" },
    promise: {
      title: "We only look. We don't touch.",
      points: [
        "Nothing changes on your website, Google listing, Clover or apps unless you approve a proposal.",
        "Share only what you're comfortable with. Skip anything.",
        "Logins are encrypted. You can change passwords or remove us any time.",
        "No commitment. This step just lets us give you a proposal with real numbers.",
      ],
    },
    steps: [
      { title: "You share access", body: "About 10 minutes. Invite us, send a login, or ask us to call and do it together." },
      { title: "We look around", body: "Read-only. We go through your sales, menu, listings and fees." },
      { title: "You get a proposal", body: "What we'd build, what it costs, and what it saves you, in plain numbers." },
    ],
    contact: { email: US, name: "NexaVision Group" },
  },
  sections: [
    {
      id: "you",
      title: "First, how do we reach you?",
      short: "About you",
      icon: "User",
      intro: "So we know who we're talking to and the easiest way to get hold of you.",
      fields: [
        { type: "text", id: "owner_first", label: "Your first name", width: "md" },
        { type: "phone", id: "owner_phone", label: "Best phone number", width: "md" },
        { type: "email", id: "owner_email", label: "Email", width: "lg" },
        {
          type: "choice",
          id: "contact_pref",
          label: "How do you like to be reached?",
          options: [
            { value: "text", label: "Text me" },
            { value: "call", label: "Call me" },
            { value: "email", label: "Email me" },
          ],
        },
        {
          type: "choice",
          id: "best_time",
          label: "When is a good time?",
          options: opts("Mornings before we open", "Afternoon slow time (3–5 PM)", "After close", "Any time, just text first"),
        },
      ],
    },
    {
      id: "core",
      title: "The big three",
      short: "Domain · Clover · Google",
      icon: "KeyRound",
      intro: "These matter most. If you only do one section today, make it this one.",
      fields: [
        readOnly,
        access({
          id: "acc_wix",
          platform: "Wix",
          what: "Where thaistationcafe.com is registered",
          priority: "key",
          color: "#0C6EFC",
          why: "Public records show your web address is registered at Wix under “Bangkok Street Food LLC”. We want to confirm it's in your own account and check when it renews. Nothing gets moved.",
          loginUrl: "https://users.wix.com/signin",
          userLabel: "Wix email",
        }),
        access({
          id: "acc_clover",
          platform: "Clover",
          what: "Your POS: menu, sales and payments",
          priority: "key",
          color: "#1EA03E",
          why: "Your menu and sales live here. We'll look at how the menu is set up and at your online-order reports, so the proposal uses your real numbers. We won't touch settings or payments.",
          invite: {
            role: "Manager",
            url: "https://www.clover.com/dashboard",
            steps: [
              "Sign in at clover.com (phone or computer).",
              "Open Employees, then tap Add Employee.",
              `Name: NexaVision. Email: ${US}. Role: Manager.`,
              "Save. Clover emails us an invite.",
            ],
          },
          loginUrl: "https://www.clover.com/dashboard",
        }),
        access({
          id: "acc_google",
          platform: "Google Business Profile",
          what: "Your Google listing: hours, photos, reviews, “Order online”",
          priority: "key",
          color: "#4285F4",
          why: "We'll see which apps Google sends your customers to, how many people find you each month, and what they search for.",
          invite: {
            role: "Manager",
            steps: [
              "On your phone, search “Thai Station Cafe” on Google while signed in to the account that manages it.",
              "Tap the ⋮ (three dots) on your business panel, then Business Profile settings, then People and access.",
              `Tap Add, type ${US}, choose Manager, then Invite.`,
            ],
          },
          userLabel: "Google account email",
        }),
      ],
    },
    {
      id: "ordering",
      title: "Your online ordering today",
      short: "Fast Bite · Menufy",
      icon: "ShoppingBag",
      intro: "This is where the 7% comes from. The sales report tells us exactly how much it costs you.",
      fields: [
        access({
          id: "acc_fastbite",
          platform: "The Fast Bite",
          what: "Your current “Order Online” site",
          priority: "key",
          color: "#E23B2E",
          why: "We'll look at your orders, the sales report the 7% is charged on, and your customer list, which is yours to keep. Read-only.",
          userLabel: "Login email or username",
        }),
        {
          type: "info",
          id: "fb_report_tip",
          tone: "tip",
          label: `Easier option: download the last 3 months' sales report from your Fast Bite dashboard and email it to ${US}.`,
        },
        access({
          id: "acc_menufy",
          platform: "Menufy",
          what: "thaistationcafebabylonny.com",
          priority: "helpful",
          color: "#F26B3A",
          why: "Only so we can save anything useful and close it out cleanly later.",
          userLabel: "Menufy email",
        }),
        {
          type: "multi",
          id: "clover_hw",
          label: "Which Clover devices do you have?",
          help: "This tells us how orders will reach your kitchen.",
          options: opts("Clover Station or Station Duo", "Clover Mini", "Clover Flex (handheld)", "Kitchen printer", "Kitchen display screen", "Not sure"),
        },
        {
          type: "yesno",
          id: "clover_online",
          label: "Have you ever used Clover's own online ordering?",
        },
      ],
    },
    {
      id: "web",
      title: "Your website & listings",
      short: "Website · Analytics · Yelp",
      icon: "Globe",
      intro: "Helpful, not required. Choose “Not sure” for anything you've never logged into. That's very common.",
      fields: [
        access({
          id: "acc_wordpress",
          platform: "Website (WordPress)",
          what: "thaistationcafe.com admin",
          priority: "helpful",
          color: "#21759B",
          why: "So we can save your pages, photos and text, and keep your old links working when the new site goes live.",
          invite: {
            role: "Administrator",
            url: "https://thaistationcafe.com/wp-admin",
            steps: [
              "Sign in at thaistationcafe.com/wp-admin.",
              "Go to Users, then Add New User.",
              `Email: ${US}. Role: Administrator. Tap Add New User.`,
            ],
          },
          loginUrl: "https://thaistationcafe.com/wp-admin",
        }),
        {
          type: "text",
          id: "web_builder",
          label: "Who built or manages your website now?",
          help: "A name, company or phone number helps, so we can ask them for files without bothering you.",
        },
        access({
          id: "acc_analytics",
          platform: "Google Analytics",
          what: "Website visitor numbers",
          priority: "helpful",
          color: "#E37400",
          why: "Shows how many people visit your site and where they come from. Never heard of it? Choose “Not sure”.",
          invite: {
            role: "Viewer",
            url: "https://analytics.google.com",
            steps: [
              "Go to analytics.google.com.",
              "Tap Admin (the gear, bottom left), then Account access management.",
              `Tap +, then Add users. Email: ${US}. Role: Viewer. Tap Add.`,
            ],
          },
        }),
        access({
          id: "acc_yelp",
          platform: "Yelp for Business",
          what: "Your Yelp page",
          priority: "helpful",
          color: "#D32323",
          why: "We'll check your photos, hours and reviews, and how your page compares with nearby Thai restaurants.",
          invite: {
            url: "https://biz.yelp.com",
            steps: ["Sign in at biz.yelp.com.", "Open Account settings, then Users.", `Add user: ${US}.`],
          },
        }),
      ],
    },
    {
      id: "apps",
      title: "Delivery apps & social",
      short: "Apps · Instagram",
      icon: "Bike",
      intro: "So we can see what the apps really cost you. Skip any you don't use.",
      fields: [
        access({
          id: "acc_doordash",
          platform: "DoorDash",
          what: "Merchant portal",
          priority: "helpful",
          color: "#FF3008",
          why: "Your monthly statements show the commission you pay, which is a big part of the savings.",
          invite: {
            url: "https://merchant-portal.doordash.com",
            steps: ["Sign in at merchant-portal.doordash.com.", "Open Settings, then Manage users.", `Add user: ${US}. Pick a view or reports role if you're asked.`],
          },
        }),
        access({
          id: "acc_ubereats",
          platform: "Uber Eats",
          what: "Uber Eats Manager",
          priority: "helpful",
          color: "#06C167",
          why: "Same as DoorDash: we want to see the commission and how many orders come through.",
          invite: {
            url: "https://merchants.ubereats.com",
            steps: ["Sign in at merchants.ubereats.com.", "Open Settings, then Users.", `Add user: ${US}.`],
          },
        }),
        access({
          id: "acc_grubhub",
          platform: "Grubhub / Seamless",
          what: "Grubhub for Restaurants",
          priority: "helpful",
          color: "#FF8000",
          why: "Same again. Grubhub and Seamless share one account.",
          invite: {
            url: "https://restaurant.grubhub.com",
            steps: ["Sign in at restaurant.grubhub.com.", "Open Settings, then User management.", `Add user: ${US}.`],
          },
        }),
        access({
          id: "acc_instagram",
          platform: "Instagram / Facebook",
          what: "@thaistationcafe_babylon",
          priority: "helpful",
          color: "#C13584",
          why: "For later, when we help with promotions. We won't post anything without asking.",
          invite: {
            url: "https://business.facebook.com",
            steps: ["Open business.facebook.com (Meta Business Suite).", "Settings, then People, then Add people.", `Email: ${US}. Give partial access.`],
          },
          userLabel: "Instagram username",
        }),
      ],
    },
    {
      id: "business",
      title: "A little about the business",
      short: "Your goals",
      icon: "Target",
      intro: "Rough answers are perfect. They help us size the proposal.",
      fields: [
        {
          type: "choice",
          id: "online_week",
          label: "About how much do online orders bring in per week? (all sites and apps together)",
          options: opts("Under $1,000", "$1,000–2,500", "$2,500–5,000", "$5,000–10,000", "Over $10,000", "Not sure"),
        },
        {
          type: "choice",
          id: "online_share",
          label: "How much of your business is online orders?",
          options: opts("A small part", "About a quarter", "About half", "Most of it", "Not sure"),
        },
        {
          type: "choice",
          id: "keep_apps",
          label: "DoorDash, Uber Eats and Grubhub: what would you like?",
          options: [
            { value: "keep_delivery", label: "Keep them for delivery, send pickup to us", hint: "What we usually recommend at first" },
            { value: "phase_out", label: "Phase them out over time" },
            { value: "talk", label: "Not sure, let's talk" },
          ],
        },
        { type: "number", id: "drivers", label: "How many delivery drivers do you have?", width: "sm" },
        { type: "text", id: "driver_hours", label: "When are drivers available?", placeholder: "e.g. 5–9 PM every day", width: "lg" },
        {
          type: "choice",
          id: "radius",
          label: "How far should your own drivers go?",
          options: opts("3 miles", "5 miles", "7 miles", "Not sure yet"),
        },
        {
          type: "multi",
          id: "goals",
          label: "What would you most like to grow?",
          options: opts(
            "More online orders",
            "Lower fees",
            "Catering",
            "Lunch traffic",
            "Higher on Google",
            "More reviews",
            "Promotions & social media",
            "Repeat customers / loyalty"
          ),
        },
        {
          type: "choice",
          id: "photos",
          label: "Do you have good photos of your dishes?",
          options: opts("Yes, plenty", "Some", "Not really, we'd like help"),
        },
        { type: "textarea", id: "anything_else", label: "Anything else we should know?", placeholder: "Frustrations, ideas, things you've always wanted…" },
      ],
    },
  ],
};
