import controlP5.*;
import java.util.Arrays;

//for output file
String fname;
PrintWriter pw;

//window size
final int windowSizeX = 1200;
final int windowSizeY = 800;

//experiment parameters
int d, w;
int numOfTargets = 13;
boolean running=false;

//experiment data
float t0;
int missCount;

//previous mouseX/Y
int pMouseX, pMouseY;


//cp5
ControlP5 cp5;
Textfield textfield1, textfield2, textfield3;
Button buttonStart, buttonSetValue;
PFont myFont;

public class targetCircle {
    private float centerX, centerY;
    private int order;

    public targetCircle (float centerX, float centerY) {
        this.centerX = centerX;
        this.centerY = centerY;
    }
    public float getPointX(){
        return centerX;
    }
    public float getPointY(){
        return centerY;
    }
    public boolean inTarget(float x, float y){
        return sqrt((centerX-x) * (centerX-x) + (centerY-y) * (centerY-y)) < w/2;
    }
}

ArrayList <targetCircle> target;
ArrayList <Integer> targetOrders;
int activeOrder = 0; 

//no log_2(x) in Processing...
float log2 (int val){
    return log(val)/log(2);
}


void setTarget(){
    target = new ArrayList<targetCircle>();
    targetOrders = new ArrayList<Integer>();
    float centerX, centerY;
    int order = 0;
    target.add(new targetCircle(windowSizeX / 2 + (d/2) * cos(2*PI-PI/2), windowSizeY / 2 + (d/2) * sin(2*PI-PI/2)));
    targetOrders.add(0);
    for(int i = 1; i <= numOfTargets; i++){
        if(numOfTargets % 2 == 0){
            if(i % 2 == 0){
                order = (order + (numOfTargets/2)) - 1;
            }else{
                order = (order + (numOfTargets/2));
            }
            if(order >= numOfTargets){
                order -= numOfTargets;
            }
        }else{
            order = (order + (numOfTargets/2) ) % numOfTargets;
        }
        centerX = windowSizeX / 2 + (d/2) * cos(2*PI * ((float)i / numOfTargets)- (PI/2));
        centerY = windowSizeY / 2 + (d/2) * sin(2*PI * ((float)i / numOfTargets)- (PI/2));
        target.add(new targetCircle(centerX, centerY));
        targetOrders.add(order);
    }
    if(numOfTargets % 2 == 0){
        targetOrders.add(0);
    }
    
}


void settings(){
    size(windowSizeX,windowSizeY);
}

//processing
void setup(){
    myFont = createFont("Menlo-Regular",8);
    cp5 = new ControlP5(this); 
    frameRate(100);
    textfield1 = cp5.addTextfield("Distance")
                    .setPosition(20,20)
                    .setText("128")
                    .setFont(myFont)
                    .setSize(40,30)
                    .setFocus(false)
                    .setAutoClear(false)
                    ;
    textfield2 = cp5.addTextfield("Width")
                    .setPosition(110,20)
                    .setText("64")
                    .setFont(myFont)
                    .setSize(40,30)
                    .setFocus(false)
                    .setAutoClear(false)
                    ;
    textfield3 = cp5.addTextfield("#Circles")
                    .setPosition(200,20)
                    .setText("13")
                    .setFont(myFont)
                    .setSize(40,30)
                    .setFocus(false)
                    .setAutoClear(false)
                    ;
    buttonStart = cp5.addButton("startExp")
                     .setLabel("start")
                     .setFont(myFont)
                     .setPosition(windowSizeX-100, windowSizeY-100)
                     .setSize(60,30)
                     ;
    buttonSetValue = cp5.addButton("set")
                        .setPosition(300, 20)
                        .setFont(myFont)
                        .setSize(50,30)
                        ;


    d = Integer.parseInt(textfield1.getText());
    println("d: " + d);
    w = Integer.parseInt(textfield2.getText());
    println("w: " + w);
    numOfTargets = Integer.parseInt(textfield3.getText());
    println("numOfTargets: " + numOfTargets);
    setTarget();
    setFile();

}

void draw () {
    smooth();
    background(150, 0.5);
    if(running)
        fill(255,255,255);
    else
        noFill();   
    for (int i = 0; i < numOfTargets; i++){
            ellipse(target.get(i).getPointX(), target.get(i).getPointY(), w, w);
    }

    if(running){
        fill(0,255,0);
        ellipse(target.get(targetOrders.get(activeOrder)).getPointX(), target.get(targetOrders.get(activeOrder)).getPointY(), w, w);
    }
}

void dispose(){
    pw.flush();
    pw.close();
}

void dataWrite(String d){
    pw.println(d);
    pw.flush();
}


// callbacks
void mousePressed(){
    if(running){
        if(activeOrder > 0){
            float t = millis()-t0;
            float moveDist = sqrt((pMouseX-mouseX)*(pMouseX-mouseX) + (pMouseY-mouseY)*(pMouseY-mouseY));
            moveDist = float(round(moveDist*pow(10,2)))/pow(10,2); //Round to the 2nd decimal place
            if(target.get(targetOrders.get(activeOrder)).inTarget(mouseX, mouseY)){
                println(targetOrders.get(activeOrder-1) + "->" + targetOrders.get(activeOrder) + " time: " + t + " ms");
                dataWrite(new String(activeOrder + "," + t + "," + moveDist + ",0"));
            }else{
                missCount++;
                println("NG");
                dataWrite(new String(activeOrder + "," + t + "," + moveDist + ",1"));
            }
        }
        pMouseX = mouseX;
        pMouseY = mouseY;
        activeOrder++;
        if( (activeOrder > numOfTargets   && numOfTargets % 2 == 1) || 
            (activeOrder > numOfTargets+1 && numOfTargets % 2 == 0) ){
            pw.flush();
            running = false;
            println("miss: " + missCount + " time(s)");     
        }
        t0 = millis();
    }
}

public void setFile(){
    fname = sketchPath() + "/";
    fname += "d" + String.valueOf(d) + "w" + String.valueOf(w) + ".csv";
    File file = new File(fname);
    if(file.exists()){
       String[] all = loadStrings(fname);
       pw = createWriter(fname);
       for(String line : all){
          dataWrite(line);
       }
    }else{
       pw = createWriter(fname);
    }
}

public void set(){
    pw.close();
    d = Integer.parseInt(textfield1.getText());
    println("d: " + d);
    w = Integer.parseInt(textfield2.getText());
    println("w: " + w);
    numOfTargets = Integer.parseInt(textfield3.getText());
    println("numOfTargets: " + numOfTargets);
    setTarget();

    setFile();
    
}

public void startExp(){
    dataWrite(new String("try,time,mouseMoveDistace,miss,"+hour()+","+minute()+","+second()));
    running = true;
    t0 = millis();
    missCount = 0;
    if(activeOrder != 0){
        activeOrder = 0;
    }
}
