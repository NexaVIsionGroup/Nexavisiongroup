// "Jail" theme: every phone ships locked up (by its maker, its carrier and whatever
// tower it gets handed); the Nexa Signal Engine gets it out and locks it ON instead.
//
// REVERT: set JAIL_THEME to false (or set NEXT_PUBLIC_NEXA_JAIL=0 in Vercel) and
// redeploy. Every themed line is written as t(jail, plain) so the plain copy is
// still right next to it, and the bars texture is scoped to .np[data-jail="true"].
export const JAIL_THEME = process.env.NEXT_PUBLIC_NEXA_JAIL ? process.env.NEXT_PUBLIC_NEXA_JAIL !== "0" : true;

export const t = <T>(jail: T, plain: T): T => (JAIL_THEME ? jail : plain);
