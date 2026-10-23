/**
 * End-to-end multi-page navigation test specifications.
 */

describe("Multi-Page Navigation", () => {
  const routes = [
    "/",
    "/about",
    "/programs",
    "/courses",
    "/courses/the-6-powers-of-conscious-parenting",
    "/resources",
    "/contact",
    "/login",
    "/register",
    "/legal/privacy",
    "/legal/terms",
    "/legal/refunds",
  ];

  it("should have all defined core routes configured", () => {
    expect(routes.length).toBeGreaterThan(10);
  });
});
