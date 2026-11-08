-- ====================================================================
-- Seed Data: Advanced Book Management REST API
-- Sample records for testing CRUD, Search, Filter, Sort, Pagination
-- ====================================================================

INSERT INTO books (title, author, price) VALUES
    ('Python Crash Course', 'Eric Matthes', 29.99),
    ('Fluent Python', 'Luciano Ramalho', 49.99),
    ('Learning Python', 'Mark Lutz', 59.99),
    ('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 37.50),
    ('The Pragmatic Programmer', 'Andrew Hunt and David Thomas', 42.00),
    ('Designing Data-Intensive Applications', 'Martin Kleppmann', 45.00),
    ('Database Internals: A Deep-Dive Guide', 'Alex Petrov', 39.95),
    ('Node.js Design Patterns', 'Mario Casciaro and Luciano Mammino', 44.99),
    ('Effective Java', 'Joshua Bloch', 41.25),
    ('JavaScript: The Definitive Guide', 'David Flanagan', 38.50),
    ('Modern Full-Stack Development', 'Frank Zammetti', 32.00),
    ('Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow', 'Aurélien Géron', 54.00),
    ('Site Reliability Engineering', 'Betsy Beyer et al.', 34.99),
    ('Building Microservices', 'Sam Newman', 48.00),
    ('Introduction to Algorithms', 'Thomas H. Cormen et al.', 89.99),
    ('Refactoring: Improving the Design of Existing Code', 'Martin Fowler', 47.95),
    ('Computer Networking: A Top-Down Approach', 'James Kurose and Keith Ross', 75.00),
    ('Structure and Interpretation of Computer Programs', 'Harold Abelson and Gerald Jay Sussman', 65.50),
    ('Cracking the Coding Interview', 'Gayle Laakmann McDowell', 35.00),
    ('Grokking Algorithms', 'Aditya Bhargava', 28.50)
ON CONFLICT DO NOTHING;

