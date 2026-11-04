// All wording for the new marketing site lives here.
// Approved draft: docs/renovation/phase1-copy.md

export const CHECKUP_HREF = "/contact";

export const nav = [
  { label: "Business App", href: "/#app" },
  { label: "Our Work", href: "/#work" },
  { label: "Who We Help", href: "/#who" },
  { label: "Pricing", href: "/#pricing" },
  { label: "About", href: "/about" },
];

// Alerts that pop up on the hero phone. Each one is something a real client's app does.
export const heroAlerts = [
  { app: "Orders", title: "New online order", detail: "Pad Thai, Green Curry · Pickup 6:15", amount: "$42.50", tone: "sun" },
  { app: "Quotes", title: "Quote accepted", detail: "Back yard cleanup + mulch", amount: "$1,280", tone: "pine" },
  { app: "Drive", title: "12 photos added", detail: "Site walk, Building C", amount: "", tone: "ink" },
  { app: "Payments", title: "Invoice paid", detail: "Deposit, kitchen remodel", amount: "$3,500", tone: "pine" },
  { app: "Reviews", title: "New 5-star review", detail: "“Best curry in town!” Reply sent", amount: "", tone: "sun" },
  { app: "Inbox", title: "New email", detail: "Request for catering, 40 people", amount: "", tone: "ink" },
  { app: "Store", title: "Order shipped", detail: "2 hoodies, tracking sent", amount: "$96.00", tone: "pine" },
] as const;

export const juggling = [
  "Texts with customers",
  "Quotes on paper",
  "A separate payment app",
  "Files in five places",
  "Emails you can't find",
  "A website you can't change",
];

export const features = [
  { icon: "Inbox", title: "Your own email inbox", text: "Every business email and attachment in one place. Reply from your phone and share with your team." },
  { icon: "FolderOpen", title: "Your own private Drive", text: "Store photos, plans, contracts and files. Like Google Drive, but it's yours." },
  { icon: "FileSignature", title: "Quotes and estimates", text: "Send a professional quote in minutes. Customers accept online, and can even send you a video of the job." },
  { icon: "CreditCard", title: "Invoices and payments", text: "Send a bill with a pay button. Save cards on file and set up payment plans." },
  { icon: "UserRound", title: "Customer accounts", text: "Customers log in to see their quotes, bills and job progress. Fewer “just checking in” calls." },
  { icon: "ShoppingBag", title: "Online ordering and store", text: "Take food orders or sell products online, paid up front." },
  { icon: "Star", title: "Google review replies", text: "Every review gets a thoughtful reply, without you lifting a finger." },
  { icon: "Users", title: "Your team", text: "Add staff, choose who can see what, and keep track of tasks." },
  { icon: "PenLine", title: "Edit your own website", text: "Change hours, menus, photos and announcements yourself. No waiting on anyone." },
  { icon: "BellRing", title: "Alerts on your phone", text: "New order, new lead, new email, new payment. Your phone tells you right away." },
] as const;

export const work = [
  { name: "Den Chai", kind: "Thai restaurant", url: "https://den-chai.com", img: "/site/work/denchai-v1.jpg",
    text: "Website, online ordering with card payments, an owner app to change the menu and hours, a shared inbox and Google review replies." },
  { name: "RO Unlimited", kind: "Construction and development", url: "https://rounlimited.com", img: "/site/work/rounlimited-v1.jpg",
    text: "A full business app: estimates, customers, employees, vendors, tasks, an email inbox, its own private Drive and an Android app." },
  { name: "JHPS Florida", kind: "Lawn and property services", url: "https://jhpsfl.com", img: "/site/work/jhps-v1.jpg",
    text: "Video quote requests, estimates customers accept online, invoices, saved cards, automatic billing and a customer portal." },
  { name: "CrunchTime Bullies", kind: "Breeder and online store", url: "https://crunchtymebullies.com", img: "/site/work/crunchtime-v1.jpg",
    text: "Website plus a live store that prints and ships merch automatically, a design studio and an owner dashboard." },
  { name: "Palm Art Studio", kind: "Artist", url: "https://palmartstudio.com", img: "/site/work/palmart-v1.jpg",
    text: "Gallery, online art sales, a “how it was made” timeline for each piece and an owner app to run it all." },
  { name: "Arctic Solutions", kind: "Commercial refrigeration and HVAC · design concept", url: "https://arctic.nexavisiongroup.com", img: "/site/work/arctic-v1.jpg",
    text: "A concept we designed for the owner, with emergency service requests and quote requests front and center. They loved it." },
];

export const audiences = [
  { title: "Restaurants and cafés", text: "Website, online menu and ordering, Google reviews, hours and holiday closures, staff." },
  { title: "Contractors and home services", text: "Quotes (including video), invoices, payment plans, a customer portal and job photos in your Drive." },
  { title: "Law, medical, insurance and accounting offices", text: "Client intake forms, secure document sharing, your own inbox and appointment requests." },
  { title: "Hotels and rentals", text: "Booking requests, guest information pages, reviews and staff tools." },
  { title: "Shops and makers", text: "An online store with products, orders and shipping that runs itself." },
];

export const steps = [
  { title: "Free check-up", text: "We look at your current website and online presence and show you what's costing you customers. No cost, no pressure." },
  { title: "We build it", text: "Your website and your business app, set up with your logo, your services and your accounts." },
  { title: "We keep it running", text: "Hosting, updates, fixes and new features. You call us, not a help desk." },
];

export const pricing = [
  { name: "Website", price: "$1,500", note: "starting at", text: "A custom website that works on every phone, Google set up, and content you can edit yourself." },
  { name: "Website and Business App", price: "$4,500", note: "starting at", featured: true, text: "Everything in Website, plus your own app. Pick the features you need: inbox, Drive, quotes, invoices, payments, alerts." },
  { name: "Custom Build", price: "$10,000", note: "starting at", text: "Online stores, ordering systems, Android apps, or anything specific to how your business works." },
  { name: "Large and multi-location", price: "Let's talk", note: "", text: "Full operations platforms, multiple locations, staff and vendor systems, and connections to the tools you already use." },
];

export const carePlans = [
  { name: "Care Plan", price: "$99", text: "Hosting, security, updates, small changes and support." },
  { name: "App Care Plan", price: "$249", text: "Care Plan plus app hosting, storage and new features every quarter." },
];

// Pinned phone story: each step swaps the phone screen.
export const appStory = [
  { screen: "inbox", title: "Your own email inbox", text: "Every business email and attachment lands in one place. Reply from your phone, assign it to someone on your team, never lose a thread again.", who: "Den Chai, RO Unlimited, NexaVision" },
  { screen: "drive", title: "Your own private Drive", text: "Job photos, plans, contracts, invoices. Store and share files like Google Drive, except it's yours, with your name on it and no monthly per-person fees.", who: "RO Unlimited" },
  { screen: "quotes", title: "Quotes customers accept online", text: "Build a professional quote in minutes. Customers can send you a video of the job first, then accept your quote with one tap.", who: "JHPS Florida" },
  { screen: "payments", title: "Invoices that get paid", text: "Every bill has a pay button. Save cards on file, split jobs into deposits and payment plans, and see what's paid at a glance.", who: "JHPS Florida" },
  { screen: "orders", title: "Online orders and a store", text: "Take food orders or sell products online, paid up front. Orders show up on your phone the second they come in.", who: "Den Chai, CrunchTime Bullies" },
  { screen: "reviews", title: "Google review replies", text: "Every review gets a thoughtful, on-brand reply automatically. Your rating keeps climbing while you run the business.", who: "Den Chai" },
] as const;

export const extras = [
  { title: "Customer accounts", text: "Customers log in to see their quotes, bills and job progress." },
  { title: "Your team", text: "Add staff, choose who can see what, and track tasks." },
  { title: "Edit your own website", text: "Change hours, menus, photos and announcements yourself." },
  { title: "Alerts on your phone", text: "New order, lead, email or payment? Your phone tells you instantly." },
  { title: "Android app", text: "Your business app on the home screen, with your logo on it." },
  { title: "Connects to what you use", text: "Square, Stripe, Google, email, shipping and more." },
];

export const marquee = ["Den Chai", "RO Unlimited", "JHPS Florida", "CrunchTime Bullies", "Palm Art Studio", "Websites", "Business apps", "Online ordering", "Private Drives", "Email inboxes", "Quotes and invoices", "Online stores", "Android apps"];
