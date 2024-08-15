import mysql.connector
from mysql.connector import Error

def create_connection():
    """ Create a database connection to the MySQL server """
    connection = None
    try:
        connection = mysql.connector.connect(
            host='118.34.163.142', 
            user='root', 
            password='231943', 
            database='maitutor_0815',
            port=3306
        )
        if connection.is_connected():
            print("Connected to MySQL database")
    except Error as e:
        print(f"Error: '{e}'")
    return connection

def execute_query(connection, query):
    """ Execute a single query """
    cursor = connection.cursor()
    try:
        cursor.execute(query)
        connection.commit()
        print("Query executed successfully")
    except Error as e:
        print(f"Error: '{e}'")

def read_query(connection, query):
    """ Read data from the database """
    cursor = connection.cursor()
    result = None
    try:
        cursor.execute(query)
        result = cursor.fetchall()
        return result
    except Error as e:
        print(f"Error: '{e}'")
        return None

# 연결 생성
connection = create_connection()

# badges 테이블에서 모든 레코드를 읽기
select_badges = "SELECT * FROM badges;"
badges = read_query(connection, select_badges)

if badges:
    print("badges 테이블 데이터:")
    for badge in badges:
        print(badge)

# categories 테이블에서 모든 레코드를 읽기
select_categories = "SELECT * FROM categories;"
categories = read_query(connection, select_categories)

if categories:
    print("categories 테이블 데이터:")
    for category in categories:
        print(category)

# 연결 닫기
if connection.is_connected():
    connection.close()
    print("MySQL connection is closed")