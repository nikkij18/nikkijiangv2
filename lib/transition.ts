/*
  Lets a page take over navigation away from itself with its own exit animation.
  The HUD (scroll, arrow keys, nav links) asks tryLeave() first; if the current page
  claims the navigation it runs its animation and calls router.push itself.
*/
type LeaveHandler = (href: string) => boolean;

let handler: LeaveHandler | null = null;

export function setLeaveHandler(h: LeaveHandler | null) {
  handler = h;
}

export function tryLeave(href: string) {
  return handler?.(href) ?? false;
}
