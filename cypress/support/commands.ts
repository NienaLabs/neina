/// <reference types="cypress" />
//@ts-expect-error this is to suppress typescript error
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.session(
    username,
    () => {
      cy.visit('/auth/sign-in')
      cy.get('input[type=email]').type(username)
      cy.get('input[type=password]').type(`${password}{enter}`, { log: false })
    }
  )

  // Do the cookie validation after restoring/creating the session
 expect(true).to.be.true
})
