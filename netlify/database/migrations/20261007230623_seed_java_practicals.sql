INSERT INTO "nster_library_questions" ("question", "answer", "code", "language", "filename", "source_key", "created_at")
VALUES
('Constructor Overloading, Method Overloading, Static Method', 'Demonstrates Constructor Overloading, Method Overloading, Static Method using the Java code provided in the practical.', 'class Box {
    int l, w;
    Box() { l = w = 1; }
    Box(int s) { l = w = s; }
    Box(int l, int w) { this.l = l; this.w = w; }
    int area() { return l * w; }
    int area(int h) { return l * w * h; }              // method overloading
    static void info() { System.out.println("Static method of Box"); }
}
public class P1 {
    public static void main(String[] a) {
        Box.info();
        System.out.println(new Box().area());
        System.out.println(new Box(4).area());
        System.out.println(new Box(2, 3).area(5));
    }
}', 'Java', 'P1.java', 'repo:java_practicals_1_to_35.json:1', CURRENT_TIMESTAMP - INTERVAL '0 milliseconds'),
('Inheritance', 'Demonstrates Inheritance using the Java code provided in the practical.', 'class Animal { void eat() { System.out.println("Eating..."); } }
class Dog extends Animal { void bark() { System.out.println("Barking..."); } }
public class P2 {
    public static void main(String[] a) {
        Dog d = new Dog();
        d.eat(); d.bark();
    }
}', 'Java', 'P2.java', 'repo:java_practicals_1_to_35.json:2', CURRENT_TIMESTAMP - INTERVAL '1 milliseconds'),
('Method Overriding', 'Demonstrates Method Overriding using the Java code provided in the practical.', 'class Bank { double rate() { return 5.0; } }
class SBI extends Bank { @Override double rate() { return 6.5; } }
class HDFC extends Bank { @Override double rate() { return 7.0; } }
public class P3 {
    public static void main(String[] a) {
        Bank b = new SBI();   System.out.println("SBI: " + b.rate());
        b = new HDFC();       System.out.println("HDFC: " + b.rate());
    }
}', 'Java', 'P3.java', 'repo:java_practicals_1_to_35.json:3', CURRENT_TIMESTAMP - INTERVAL '2 milliseconds'),
('Abstract Classes and Methods', 'Demonstrates Abstract Classes and Methods using the Java code provided in the practical.', 'abstract class Shape {
    abstract double area();
    void show() { System.out.println("Area = " + area()); }
}
class Circle extends Shape {
    double r; Circle(double r) { this.r = r; }
    double area() { return Math.PI * r * r; }
}
class Rectangle extends Shape {
    double l, w; Rectangle(double l, double w) { this.l = l; this.w = w; }
    double area() { return l * w; }
}
public class P4 {
    public static void main(String[] a) {
        new Circle(3).show();
        new Rectangle(4, 5).show();
    }
}', 'Java', 'P4.java', 'repo:java_practicals_1_to_35.json:4', CURRENT_TIMESTAMP - INTERVAL '3 milliseconds'),
('Interfaces', 'Demonstrates Interfaces using the Java code provided in the practical.', 'interface Vehicle { void start(); void stop(); }
class Car implements Vehicle {
    public void start() { System.out.println("Car started"); }
    public void stop() { System.out.println("Car stopped"); }
}
public class P5 {
    public static void main(String[] a) {
        Vehicle v = new Car();
        v.start(); v.stop();
    }
}', 'Java', 'P5.java', 'repo:java_practicals_1_to_35.json:5', CURRENT_TIMESTAMP - INTERVAL '4 milliseconds'),
('User-Defined Exception', 'Demonstrates User-Defined Exception using the Java code provided in the practical.', 'class AgeException extends Exception {
    AgeException(String msg) { super(msg); }
}
public class P6 {
    static void check(int age) throws AgeException {
        if (age < 18) throw new AgeException("Age must be 18 or above");
        System.out.println("Eligible to vote");
    }
    public static void main(String[] a) {
        try { check(20); check(15); }
        catch (AgeException e) { System.out.println("Caught: " + e.getMessage()); }
    }
}', 'Java', 'P6.java', 'repo:java_practicals_1_to_35.json:6', CURRENT_TIMESTAMP - INTERVAL '5 milliseconds'),
('Swing - Student Resume Form', 'Demonstrates Swing - Student Resume Form using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P7 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Student Resume");
        f.setLayout(new GridLayout(8, 2, 5, 5));
        JTextField name = new JTextField(), email = new JTextField(), phone = new JTextField();
        JRadioButton m = new JRadioButton("Male", true), fm = new JRadioButton("Female");
        ButtonGroup g = new ButtonGroup(); g.add(m); g.add(fm);
        JPanel gp = new JPanel(); gp.add(m); gp.add(fm);
        JComboBox<String> course = new JComboBox<>(new String[]{"BSc CS", "BSc IT", "BCom"});
        JCheckBox j = new JCheckBox("Java"), py = new JCheckBox("Python");
        JPanel sp = new JPanel(); sp.add(j); sp.add(py);
        JTextArea obj = new JTextArea(3, 15);
        JButton sub = new JButton("Submit");
        f.add(new JLabel("Name")); f.add(name);   f.add(new JLabel("Email")); f.add(email);
        f.add(new JLabel("Phone")); f.add(phone); f.add(new JLabel("Gender")); f.add(gp);
        f.add(new JLabel("Course")); f.add(course); f.add(new JLabel("Skills")); f.add(sp);
        f.add(new JLabel("Objective")); f.add(new JScrollPane(obj));
        f.add(new JLabel()); f.add(sub);
        sub.addActionListener(e -> JOptionPane.showMessageDialog(f, "Resume of " + name.getText() + " submitted"));
        f.setSize(420, 400); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P7.java', 'repo:java_practicals_1_to_35.json:7', CURRENT_TIMESTAMP - INTERVAL '6 milliseconds'),
('Swing - Simple Calculator', 'Demonstrates Swing - Simple Calculator using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P8 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Calculator"); f.setLayout(new GridLayout(0, 1, 5, 5));
        JTextField t1 = new JTextField(), t2 = new JTextField();
        JLabel r = new JLabel("Result: ", JLabel.CENTER);
        JPanel bp = new JPanel(new GridLayout(1, 4));
        for (String o : new String[]{"+", "-", "*", "/"}) {
            JButton b = new JButton(o);
            b.addActionListener(e -> {
                try {
                    double p = Double.parseDouble(t1.getText()), q = Double.parseDouble(t2.getText());
                    double z = o.equals("+") ? p + q : o.equals("-") ? p - q : o.equals("*") ? p * q : p / q;
                    r.setText("Result: " + z);
                } catch (Exception ex) { r.setText("Invalid input"); }
            });
            bp.add(b);
        }
        f.add(t1); f.add(t2); f.add(bp); f.add(r);
        f.setSize(300, 220); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P8.java', 'repo:java_practicals_1_to_35.json:8', CURRENT_TIMESTAMP - INTERVAL '7 milliseconds'),
('Swing - Accept Record of a Table and Submit', 'Demonstrates Swing - Accept Record of a Table and Submit using the Java code provided in the practical.', 'import javax.swing.*; import javax.swing.table.DefaultTableModel; import java.awt.*;
public class P9 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Employee Record");
        DefaultTableModel m = new DefaultTableModel(new String[]{"ID", "Name", "Dept"}, 0);
        JTextField id = new JTextField(), name = new JTextField(), dept = new JTextField();
        JButton sub = new JButton("Submit");
        JPanel p = new JPanel(new GridLayout(4, 2, 5, 5));
        p.add(new JLabel("ID")); p.add(id); p.add(new JLabel("Name")); p.add(name);
        p.add(new JLabel("Dept")); p.add(dept); p.add(sub);
        sub.addActionListener(e -> {
            m.addRow(new Object[]{id.getText(), name.getText(), dept.getText()});
            id.setText(""); name.setText(""); dept.setText("");
        });
        f.add(p, BorderLayout.NORTH); f.add(new JScrollPane(new JTable(m)), BorderLayout.CENTER);
        f.setSize(350, 330); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P9.java', 'repo:java_practicals_1_to_35.json:9', CURRENT_TIMESTAMP - INTERVAL '8 milliseconds'),
('Method Overriding - Employee and Developer', 'Demonstrates Method Overriding - Employee and Developer using the Java code provided in the practical.', 'class Employee { void work() { System.out.println("Employee does general work"); } }
class Developer extends Employee {
    @Override void work() { System.out.println("Developer writes and tests code"); }
}
public class P10 {
    public static void main(String[] a) {
        Employee e = new Developer();
        e.work();
    }
}', 'Java', 'P10.java', 'repo:java_practicals_1_to_35.json:10', CURRENT_TIMESTAMP - INTERVAL '9 milliseconds'),
('Class and Object - Student', 'Demonstrates Class and Object - Student using the Java code provided in the practical.', 'class Student {
    int roll; String name; double marks;
    void display() { System.out.println(roll + " " + name + " " + marks); }
}
public class P11 {
    public static void main(String[] a) {
        Student s1 = new Student(); s1.roll = 1; s1.name = "Amit"; s1.marks = 85.5;
        Student s2 = new Student(); s2.roll = 2; s2.name = "Riya"; s2.marks = 91;
        s1.display(); s2.display();
    }
}', 'Java', 'P11.java', 'repo:java_practicals_1_to_35.json:11', CURRENT_TIMESTAMP - INTERVAL '10 milliseconds'),
('Constructor - Book', 'Demonstrates Constructor - Book using the Java code provided in the practical.', 'class Book {
    String title, author; double price;
    Book(String t, String a, double p) { title = t; author = a; price = p; }
    void show() { System.out.println(title + " | " + author + " | Rs." + price); }
}
public class P12 {
    public static void main(String[] a) {
        new Book("Java Complete Reference", "Herbert Schildt", 650).show();
    }
}', 'Java', 'P12.java', 'repo:java_practicals_1_to_35.json:12', CURRENT_TIMESTAMP - INTERVAL '11 milliseconds'),
('Method Overloading - Area', 'Demonstrates Method Overloading - Area using the Java code provided in the practical.', 'public class P13 {
    static int area(int side)             { return side * side; }       // square
    static int area(int l, int b)         { return l * b; }             // rectangle
    static double area(double radius)     { return Math.PI * radius * radius; } // circle
    public static void main(String[] a) {
        System.out.println("Square    : " + area(5));
        System.out.println("Rectangle : " + area(4, 6));
        System.out.println("Circle    : " + area(2.5));
    }
}', 'Java', 'P13.java', 'repo:java_practicals_1_to_35.json:13', CURRENT_TIMESTAMP - INTERVAL '12 milliseconds'),
('Static Members - Object Counter', 'Demonstrates Static Members - Object Counter using the Java code provided in the practical.', 'class Student {
    static int count = 0;
    Student() { count++; }
}
public class P14 {
    public static void main(String[] a) {
        new Student(); new Student(); new Student();
        System.out.println("Objects created: " + Student.count);
    }
}', 'Java', 'P14.java', 'repo:java_practicals_1_to_35.json:14', CURRENT_TIMESTAMP - INTERVAL '13 milliseconds'),
('Single Inheritance - Person and Student', 'Demonstrates Single Inheritance - Person and Student using the Java code provided in the practical.', 'class Person {
    String name = "Amit";
    void showName() { System.out.println("Name: " + name); }
}
class Student extends Person {
    int roll = 101;
    void showRoll() { System.out.println("Roll: " + roll); }
}
public class P15 {
    public static void main(String[] a) {
        Student s = new Student();
        s.showName(); s.showRoll();
    }
}', 'Java', 'P15.java', 'repo:java_practicals_1_to_35.json:15', CURRENT_TIMESTAMP - INTERVAL '14 milliseconds'),
('Multilevel Inheritance - Person, Employee, Manager', 'Demonstrates Multilevel Inheritance - Person, Employee, Manager using the Java code provided in the practical.', 'class Person   { String name = "Riya"; }
class Employee extends Person { int id = 501; }
class Manager extends Employee {
    String dept = "IT";
    void show() { System.out.println(name + " " + id + " " + dept); }
}
public class P16 {
    public static void main(String[] a) { new Manager().show(); }
}', 'Java', 'P16.java', 'repo:java_practicals_1_to_35.json:16', CURRENT_TIMESTAMP - INTERVAL '15 milliseconds'),
('Method Overriding - Animal, Dog, Cat', 'Demonstrates Method Overriding - Animal, Dog, Cat using the Java code provided in the practical.', 'class Animal { void sound() { System.out.println("Animal sound"); } }
class Dog extends Animal { @Override void sound() { System.out.println("Dog barks: Woof"); } }
class Cat extends Animal { @Override void sound() { System.out.println("Cat meows: Meow"); } }
public class P17 {
    public static void main(String[] a) {
        Animal x = new Dog(); x.sound();
        x = new Cat();         x.sound();
    }
}', 'Java', 'P17.java', 'repo:java_practicals_1_to_35.json:17', CURRENT_TIMESTAMP - INTERVAL '16 milliseconds'),
('Abstract Class (Shape, Circle, Rectangle)', 'Same as Practical 4: demonstrates an abstract Shape class with area() implemented by Circle and Rectangle.', 'abstract class Shape {
    abstract double area();
    void show() { System.out.println("Area = " + area()); }
}
class Circle extends Shape {
    double r; Circle(double r) { this.r = r; }
    double area() { return Math.PI * r * r; }
}
class Rectangle extends Shape {
    double l, w; Rectangle(double l, double w) { this.l = l; this.w = w; }
    double area() { return l * w; }
}
public class P18 {
    public static void main(String[] a) {
        new Circle(3).show();
        new Rectangle(4, 5).show();
    }
}', 'Java', 'P18.java', 'repo:java_practicals_1_to_35.json:18', CURRENT_TIMESTAMP - INTERVAL '17 milliseconds'),
('Interface - Printable', 'Demonstrates Interface - Printable using the Java code provided in the practical.', 'interface Printable { void print(); }
class Student implements Printable {
    String name; int roll;
    Student(String n, int r) { name = n; roll = r; }
    public void print() { System.out.println("Student: " + name + ", Roll: " + roll); }
}
public class P19 {
    public static void main(String[] a) { new Student("Amit", 7).print(); }
}', 'Java', 'P19.java', 'repo:java_practicals_1_to_35.json:19', CURRENT_TIMESTAMP - INTERVAL '18 milliseconds'),
('Multiple Interfaces - Readable and Writable', 'Demonstrates Multiple Interfaces - Readable and Writable using the Java code provided in the practical.', 'interface Readable { void read(); }
interface Writable { void write(); }
class FileHandler implements Readable, Writable {
    public void read() { System.out.println("Reading data..."); }
    public void write() { System.out.println("Writing data..."); }
}
public class P20 {
    public static void main(String[] a) {
        FileHandler f = new FileHandler();
        f.read(); f.write();
    }
}', 'Java', 'P20.java', 'repo:java_practicals_1_to_35.json:20', CURRENT_TIMESTAMP - INTERVAL '19 milliseconds'),
('Method Overriding - Animal and Dog', 'Demonstrates Method Overriding - Animal and Dog using the Java code provided in the practical.', 'class Animal { void sound() { System.out.println("Animal makes a sound"); } }
class Dog extends Animal { @Override void sound() { System.out.println("Dog barks"); } }
public class P21 {
    public static void main(String[] a) { new Dog().sound(); }
}', 'Java', 'P21.java', 'repo:java_practicals_1_to_35.json:21', CURRENT_TIMESTAMP - INTERVAL '20 milliseconds'),
('Method Overriding - Vehicle and Car', 'Demonstrates Method Overriding - Vehicle and Car using the Java code provided in the practical.', 'class Vehicle { void run() { System.out.println("Vehicle is running"); } }
class Car extends Vehicle { @Override void run() { System.out.println("Car is running on 4 wheels"); } }
public class P22 {
    public static void main(String[] a) {
        Vehicle v = new Car();
        v.run();
    }
}', 'Java', 'P22.java', 'repo:java_practicals_1_to_35.json:22', CURRENT_TIMESTAMP - INTERVAL '21 milliseconds'),
('Method Overriding - Person and Student', 'Demonstrates Method Overriding - Person and Student using the Java code provided in the practical.', 'class Person {
    void display() { System.out.println("Person details"); }
}
class Student extends Person {
    @Override void display() { System.out.println("Student: Amit, Roll 7, Class SYCS"); }
}
public class P23 {
    public static void main(String[] a) { new Student().display(); }
}', 'Java', 'P23.java', 'repo:java_practicals_1_to_35.json:23', CURRENT_TIMESTAMP - INTERVAL '22 milliseconds'),
('Method Overriding - Shape, Circle, Rectangle', 'Demonstrates Method Overriding - Shape, Circle, Rectangle using the Java code provided in the practical.', 'class Shape { double area() { return 0; } }
class Circle extends Shape {
    double r = 3;
    @Override double area() { return Math.PI * r * r; }
}
class Rectangle extends Shape {
    double l = 4, w = 5;
    @Override double area() { return l * w; }
}
public class P24 {
    public static void main(String[] a) {
        Shape s = new Circle();     System.out.println("Circle: " + s.area());
        s = new Rectangle();        System.out.println("Rectangle: " + s.area());
    }
}', 'Java', 'P24.java', 'repo:java_practicals_1_to_35.json:24', CURRENT_TIMESTAMP - INTERVAL '23 milliseconds'),
('Swing - Student Form', 'Demonstrates Swing - Student Form using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P25 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Student Form"); f.setLayout(new FlowLayout());
        JTextField n = new JTextField(12), r = new JTextField(12);
        JComboBox<String> c = new JComboBox<>(new String[]{"BSc CS", "BSc IT", "BCom"});
        JRadioButton m = new JRadioButton("Male", true), fm = new JRadioButton("Female");
        ButtonGroup g = new ButtonGroup(); g.add(m); g.add(fm);
        JButton b = new JButton("Submit");
        f.add(new JLabel("Name")); f.add(n); f.add(new JLabel("Roll No")); f.add(r);
        f.add(new JLabel("Course")); f.add(c); f.add(m); f.add(fm); f.add(b);
        b.addActionListener(e -> JOptionPane.showMessageDialog(f, "Name: " + n.getText()
            + "\nRoll: " + r.getText() + "\nCourse: " + c.getSelectedItem()
            + "\nGender: " + (m.isSelected() ? "Male" : "Female")));
        f.setSize(300, 260); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P25.java', 'repo:java_practicals_1_to_35.json:25', CURRENT_TIMESTAMP - INTERVAL '24 milliseconds'),
('Swing - Login Form', 'Demonstrates Swing - Login Form using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P26 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Login"); f.setLayout(new FlowLayout());
        JTextField u = new JTextField(12); JPasswordField p = new JPasswordField(12);
        JButton b = new JButton("Login");
        f.add(new JLabel("Username")); f.add(u); f.add(new JLabel("Password")); f.add(p); f.add(b);
        b.addActionListener(e -> {
            boolean ok = u.getText().equals("admin") && new String(p.getPassword()).equals("1234");
            JOptionPane.showMessageDialog(f, ok ? "Login Successful" : "Invalid Credentials");
        });
        f.setSize(300, 260); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P26.java', 'repo:java_practicals_1_to_35.json:26', CURRENT_TIMESTAMP - INTERVAL '25 milliseconds'),
('Swing - Student Registration Form', 'Demonstrates Swing - Student Registration Form using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P27 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Registration"); f.setLayout(new FlowLayout());
        JTextField n = new JTextField(12), em = new JTextField(12);
        JComboBox<String> c = new JComboBox<>(new String[]{"FYCS", "SYCS", "TYCS"});
        JRadioButton m = new JRadioButton("Male", true), fm = new JRadioButton("Female");
        ButtonGroup g = new ButtonGroup(); g.add(m); g.add(fm);
        JButton b = new JButton("Register");
        f.add(new JLabel("Name")); f.add(n); f.add(new JLabel("Email")); f.add(em);
        f.add(new JLabel("Class")); f.add(c); f.add(m); f.add(fm); f.add(b);
        b.addActionListener(e -> JOptionPane.showMessageDialog(f, n.getText() + " registered in "
            + c.getSelectedItem() + " (" + (m.isSelected() ? "Male" : "Female") + ")"));
        f.setSize(300, 260); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P27.java', 'repo:java_practicals_1_to_35.json:27', CURRENT_TIMESTAMP - INTERVAL '26 milliseconds'),
('Swing - Feedback Form', 'Demonstrates Swing - Feedback Form using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P28 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Feedback"); f.setLayout(new FlowLayout());
        JTextField n = new JTextField(14); JTextArea t = new JTextArea(4, 14);
        JRadioButton g1 = new JRadioButton("Good", true), g2 = new JRadioButton("Average"),
                     g3 = new JRadioButton("Poor");
        ButtonGroup g = new ButtonGroup(); g.add(g1); g.add(g2); g.add(g3);
        JButton b = new JButton("Submit");
        f.add(new JLabel("Name")); f.add(n); f.add(new JLabel("Comments")); f.add(new JScrollPane(t));
        f.add(g1); f.add(g2); f.add(g3); f.add(b);
        b.addActionListener(e -> JOptionPane.showMessageDialog(f, "Thank you " + n.getText()
            + "! Rating: " + (g1.isSelected() ? "Good" : g2.isSelected() ? "Average" : "Poor")));
        f.setSize(300, 260); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P28.java', 'repo:java_practicals_1_to_35.json:28', CURRENT_TIMESTAMP - INTERVAL '27 milliseconds'),
('Swing - Marks Calculator', 'Demonstrates Swing - Marks Calculator using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P29 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Marks Calculator"); f.setLayout(new FlowLayout());
        JTextField m1 = new JTextField(8), m2 = new JTextField(8), m3 = new JTextField(8);
        JButton b = new JButton("Calculate"); JLabel r = new JLabel("Total / Percentage");
        f.add(new JLabel("Sub 1")); f.add(m1); f.add(new JLabel("Sub 2")); f.add(m2);
        f.add(new JLabel("Sub 3")); f.add(m3); f.add(b); f.add(r);
        b.addActionListener(e -> {
            try {
                double t = Double.parseDouble(m1.getText()) + Double.parseDouble(m2.getText())
                         + Double.parseDouble(m3.getText());
                r.setText("Total: " + t + " Percentage: " + String.format("%.2f", t / 3) + "%");
            } catch (Exception ex) { r.setText("Enter valid marks"); }
        });
        f.setSize(300, 260); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P29.java', 'repo:java_practicals_1_to_35.json:29', CURRENT_TIMESTAMP - INTERVAL '28 milliseconds'),
('Swing - Simple Interest Calculator', 'Demonstrates Swing - Simple Interest Calculator using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P30 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Simple Interest"); f.setLayout(new FlowLayout());
        JTextField p = new JTextField(8), r = new JTextField(8), t = new JTextField(8);
        JButton b = new JButton("Calculate"); JLabel out = new JLabel("SI = ");
        f.add(new JLabel("Principal")); f.add(p); f.add(new JLabel("Rate %")); f.add(r);
        f.add(new JLabel("Time (yrs)")); f.add(t); f.add(b); f.add(out);
        b.addActionListener(e -> {
            try {
                double si = Double.parseDouble(p.getText()) * Double.parseDouble(r.getText())
                          * Double.parseDouble(t.getText()) / 100;
                out.setText("SI = " + si);
            } catch (Exception ex) { out.setText("Invalid input"); }
        });
        f.setSize(300, 260); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P30.java', 'repo:java_practicals_1_to_35.json:30', CURRENT_TIMESTAMP - INTERVAL '29 milliseconds'),
('Swing - Celsius to Fahrenheit', 'Demonstrates Swing - Celsius to Fahrenheit using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P31 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Temperature Converter"); f.setLayout(new FlowLayout());
        JTextField c = new JTextField(8); JButton b = new JButton("Convert"); JLabel r = new JLabel("Fahrenheit: ");
        f.add(new JLabel("Celsius")); f.add(c); f.add(b); f.add(r);
        b.addActionListener(e -> {
            try { r.setText("Fahrenheit: " + (Double.parseDouble(c.getText()) * 9 / 5 + 32)); }
            catch (Exception ex) { r.setText("Invalid input"); }
        });
        f.setSize(300, 260); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P31.java', 'repo:java_practicals_1_to_35.json:31', CURRENT_TIMESTAMP - INTERVAL '30 milliseconds'),
('Swing - Even/Odd Checker', 'Demonstrates Swing - Even/Odd Checker using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P32 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Even/Odd"); f.setLayout(new FlowLayout());
        JTextField t = new JTextField(8); JButton b = new JButton("Check"); JLabel r = new JLabel("Result");
        f.add(new JLabel("Number")); f.add(t); f.add(b); f.add(r);
        b.addActionListener(e -> {
            try { int n = Integer.parseInt(t.getText()); r.setText(n % 2 == 0 ? "Even" : "Odd"); }
            catch (Exception ex) { r.setText("Invalid input"); }
        });
        f.setSize(300, 260); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P32.java', 'repo:java_practicals_1_to_35.json:32', CURRENT_TIMESTAMP - INTERVAL '31 milliseconds'),
('Swing - Positive/Negative/Zero Checker', 'Demonstrates Swing - Positive/Negative/Zero Checker using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P33 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Number Checker"); f.setLayout(new FlowLayout());
        JTextField t = new JTextField(8); JButton b = new JButton("Check"); JLabel r = new JLabel("Result");
        f.add(new JLabel("Number")); f.add(t); f.add(b); f.add(r);
        b.addActionListener(e -> {
            try {
                double n = Double.parseDouble(t.getText());
                r.setText(n > 0 ? "Positive" : n < 0 ? "Negative" : "Zero");
            } catch (Exception ex) { r.setText("Invalid input"); }
        });
        f.setSize(300, 260); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P33.java', 'repo:java_practicals_1_to_35.json:33', CURRENT_TIMESTAMP - INTERVAL '32 milliseconds'),
('Swing - ComboBox Course Selection', 'Demonstrates Swing - ComboBox Course Selection using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P34 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Course Selection"); f.setLayout(new FlowLayout());
        JComboBox<String> c = new JComboBox<>(new String[]{"BSc CS", "BSc IT", "BCom", "BMS"});
        JButton b = new JButton("Show"); JLabel r = new JLabel("Selected: ");
        f.add(new JLabel("Course")); f.add(c); f.add(b); f.add(r);
        b.addActionListener(e -> r.setText("Selected: " + c.getSelectedItem()));
        f.setSize(300, 260); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P34.java', 'repo:java_practicals_1_to_35.json:34', CURRENT_TIMESTAMP - INTERVAL '33 milliseconds'),
('Swing - Student Record Form with JTextArea', 'Demonstrates Swing - Student Record Form with JTextArea using the Java code provided in the practical.', 'import javax.swing.*; import java.awt.*;
public class P35 {
    public static void main(String[] x) {
        JFrame f = new JFrame("Student Record"); f.setLayout(new FlowLayout());
        JTextField roll = new JTextField(10), name = new JTextField(10),
                   cls = new JTextField(10), marks = new JTextField(10);
        JTextArea out = new JTextArea(6, 22); out.setEditable(false);
        JButton b = new JButton("Add Record");
        f.add(new JLabel("Roll No")); f.add(roll); f.add(new JLabel("Name")); f.add(name);
        f.add(new JLabel("Class")); f.add(cls); f.add(new JLabel("Marks")); f.add(marks);
        f.add(b); f.add(new JScrollPane(out));
        b.addActionListener(e -> {
            out.append(roll.getText() + " | " + name.getText() + " | " + cls.getText()
                       + " | " + marks.getText() + "\n");
            roll.setText(""); name.setText(""); cls.setText(""); marks.setText("");
        });
        f.setSize(320, 380); f.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE); f.setVisible(true);
    }
}', 'Java', 'P35.java', 'repo:java_practicals_1_to_35.json:35', CURRENT_TIMESTAMP - INTERVAL '34 milliseconds')
ON CONFLICT ("source_key") DO NOTHING;

INSERT INTO "nster_library_imports" ("id") VALUES ('repo:java_practicals_1_to_35.json:dc538c8d7ef05a83786c9c1cd4b73ea8dc8b6e97cf0f85234b9e188f4ae7bd75') ON CONFLICT ("id") DO NOTHING;
