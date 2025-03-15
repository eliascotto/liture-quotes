use rusqlite::Connection;
use std::ops::{Deref, DerefMut};

pub struct DbConn {
    connection: Option<Connection>,
}

impl DbConn {
    pub fn new(path: &str) -> rusqlite::Result<Self> {
        let conn = Connection::open(path)?;
        Ok(DbConn {
            connection: Some(conn),
        })
    }
}

impl Deref for DbConn {
    type Target = Connection;

    fn deref(&self) -> &Self::Target {
        self.connection.as_ref().unwrap()
    }
}

impl DerefMut for DbConn {
    fn deref_mut(&mut self) -> &mut Self::Target {
        self.connection.as_mut().unwrap()
    }
}

impl Drop for DbConn {
    fn drop(&mut self) {
        // Close the connection when DbConn is dropped
        if let Some(conn) = self.connection.take() {
            let _ = conn.close();
        }
    }
}
