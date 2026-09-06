# Naseemah-001

A person creates a User, opens a Session, and can start a Password reset if they forget the password. Home is the only signed-in page.

## Language

**User**:
One person identified by a single email, with one password and a display name.
_Avoid_: Account, member, customer

**Create user**:
The person registers themselves. There is no admin invite in this context.
_Avoid_: Sign up, register, invite

**Login**:
Email and password that open a Session.
_Avoid_: Sign in

**Session**:
The current signed-in period for a User in the browser.
_Avoid_: Token in local storage

**Forgot password**:
The person asks to replace a password they no longer know. The reply does not reveal whether the email belongs to a User.
_Avoid_: Recover account, OTP login

**Password reset**:
A one-use, time-limited replacement of a User's password, completed from a link.
_Avoid_: Change password (that is a signed-in action, not this)

**Home**:
The only page a signed-in User sees.
_Avoid_: Dashboard, workspace, portal
