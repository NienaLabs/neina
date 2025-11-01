describe('HomePage',()=>{

it('should show the hompage screen',()=>{
    //@ts-expect-error this is because typechecks were supressed when creating command
    cy.login("swiftwilliams868@gmail.com","bomboclat")
    cy.visit("/")
    cy.get('h1').should('contain', "To get started, edit the page.tsx file.")
})
    
})