import controlP5.*;

PFont myFont;
ControlP5 cp5;

Button buttons[][];
Slider distanceSlider;
Slider sizeSlider;
Textfield form;
Textlabel tbi;
Textlabel it;
String[] logs;

int op1;
boolean wasDigit;
char lastOpr;
int count;
int keycount;
int numTerms;
int lastTime;
int lastMX, lastMY;
int FSIZE;

void settings(){
  size(600, 700);
}

void setup(){
    FSIZE = 12;
    String labels[][]={{"7", "8","9","/"},{"4","5","6","*"},{"1","2","3","+"},{"0","C","=","-"}};
    cp5 = new ControlP5(this);
    ControlFont f = new ControlFont(createFont("HelveticaNeue",FSIZE));
    
    sizeSlider = cp5.addSlider("sizeSlider")
                  .setLabel("SIZE")
                  .setPosition(10,10)
                  .setSize(200,30)
                  .setMin(30)
                  .setMax(120)
                  .setNumberOfTickMarks(10);
    sizeSlider.getValueLabel().setFont(new ControlFont(createFont("HelveticaNeue",FSIZE)));
    sizeSlider.setFont(new ControlFont(createFont("HelveticaNeue",8)));
    sizeSlider.setSliderMode(0);
    
    distanceSlider = cp5.addSlider("distanceSlider")
                  .setPosition(10,50)
                  .setLabel("DISTANCE")
                  .setSize(200,30)
                  .setMin(30)
                  .setMax(120)
                  .setNumberOfTickMarks(10);
    distanceSlider.getValueLabel().setFont(new ControlFont(createFont("HelveticaNeue",FSIZE)));
    distanceSlider.setFont(new ControlFont(createFont("HelveticaNeue",8)));
    distanceSlider.setSliderMode(0);

    Button sizeButton = cp5.addButton("sizeButton")
                           .setLabel("size change")
                           .setPosition(300,10)
                           .setSize(100,30)
                           .setColorBackground(color(255))
                           .setColorLabel(0);
    sizeButton.getCaptionLabel().setFont(new ControlFont(createFont("HelveticaNeue",6)));


    buttons = new Button[4][4];
    int bs=50;
    int ds=100;
    int myColor = color(255);
    for(int i=0;i<4;i++){
      for(int j=0;j<4;j++){
        buttons[i][j] = cp5.addButton("buttons"+i+j)
           .setLabel(labels[i][j])
           //.setValue(i*4+j)
           .setPosition(j*ds+10,i*ds+150)
           .setSize(bs,bs)
           .setMouseOver(false)
           .setColorForeground(myColor)
           .setColorBackground(myColor)
           .setColorLabel(0)
           .setColorActive(myColor);
        buttons[i][j].getCaptionLabel().setFont(f);
      }
    }

    form = cp5.addTextfield("result ")
     .setPosition(70,100)
     .setSize(100,40)
     .setFont(new ControlFont(createFont("HelveticaNeue",12)))
     .setFocus(true)
     .setColor(color(255));
    form.getCaptionLabel().align(ControlP5.LEFT_OUTSIDE, CENTER)
        .setFont(new ControlFont(createFont("HelveticaNeue",8)));
    
    cp5.addButton("startButton")
       .setPosition(200, 100)
       .setSize(80,40)
       .setColorBackground(color(255))
       .setColorLabel(color(0))
       .setFont(new ControlFont(createFont("HelveticaNeue",FSIZE)))
       .setLabel("start");

    
    tbi = cp5.addTextlabel("text to be input")
       .setFont(new ControlFont(createFont("Monaco",FSIZE)))
       .setText("......")
       .setSize(200,40)
       .setPosition(350, 80);
    it = cp5.addTextlabel("input text")
       .setFont(new ControlFont(createFont("Monaco",FSIZE)))
       .setText("")
       .setSize(200,40)
       .setPosition(350, 110);

    op1 = 0;
    lastOpr = '+';
    wasDigit = true;
    count = 0;
    logs=new String[100];
    keycount=0;
    numTerms=2;
    lastTime=0;
    
    sizeSlider.setValue(50);
    distanceSlider.setValue(100);
}

void draw(){
  background(100);
}


public void controlEvent(ControlEvent theEvent) {
  String name = theEvent.getController().getName();
  String label = theEvent.getController().getLabel();
  
  if(name.startsWith("buttons")){
    char key = label.charAt(0);
    int ctime = millis();
    int d =  int(sqrt(sq(mouseX-lastMX) + sq(mouseY-lastMY)));
    writefile(key + "," + (ctime-lastTime)+ "," + d, false);
    lastTime = ctime;
    lastMX = mouseX;
    lastMY = mouseY;
    String inp = it.getStringValue()+String.valueOf(key);
    it.setText(inp); 
    int op2=-1;
    if('0' <= key && key <= '9'){
      String text = "";
      if(wasDigit){
        text = form.getText();
      }
      text = text+label;
      form.setText(text);
      wasDigit = true;      
    }else if(key=='+' || key=='-' || key=='/' || key=='*' || key=='='){     
      String text = form.getText();
      op2 = Integer.parseInt(text);
      switch(lastOpr){
        case '+': op1 = op1+op2; break;
        case '-': op1 = op1-op2; break;
        case '*': op1 = op1*op2; break;
        case '/': op1 = op1/op2; break;
        case '=': op1 = op2; break;
      }
      form.setText(String.valueOf(op1));
      lastOpr = key;
      wasDigit=false;
      if(key=='='){
         count+=1;
         it.setText("");         
         if(count >= 8 ){
           tbi.setText("FINISH!!");
           saveStrings("log.csv",logs);
         }else{
           tbi.setText(newTask(numTerms));
         }
      }
    }else if(key=='C'){
      form.setText("0");
      lastOpr='+';
      op1=0;
      wasDigit=false;
      it.setText("");
      count=0;
    }
  }
}

public void startButton(int val){
  writeButtonInfo();
  String term = newTask(numTerms);
  tbi.setText(term);
  count = 0;
  lastTime = millis();
  lastMX = mouseX;
  lastMY = mouseY;
  writefile("start," + 0 + "," + 0,true);
}

public void writeButtonInfo(){
  String result[] = new String[19];
  int bs = (int)sizeSlider.getValue();
  int ds = (int)distanceSlider.getValue();
  result[0] = "buttonsize," + bs;
  result[1] = "buttondistance," + ds;
  result[2] = "START,240,120";
  
  for(int i=0;i<4;i++){
       for(int j=0;j<4;j++){
          String l = buttons[i][j].getLabel();
          int x = j*ds+10+bs/2;
          int y = i*ds+150+bs/2;
          result[3+i*4+j] = l + "," + x + "," + y;
       }
  }
  saveStrings("buttons.csv", result);
}

public void writefile(String str, boolean start){
  if(start){
    logs=new String[100];
    keycount=0;
  }
  println(str);
  logs[keycount] = str;
  keycount+=1;
}

public String newTask(int nums){
  String term = String.valueOf(10+int(random(90)));
  for(int i=0;i<nums-1;i++){
    switch(int(random(4))){
      case 0: term += "+"; break;
      case 1: term += "-"; break;
      case 2: term += "*"; break;
      case 3: term += "/"; break;
    }
    term = term + String.valueOf(10+int(random(90)));
  }
  return term;
}

public void sizeButton(int val){
    int bs = (int)sizeSlider.getValue();
    int ds = (int)distanceSlider.getValue();

    for(int i=0;i<4;i++){
       for(int j=0;j<4;j++){
          buttons[i][j].setPosition(j*ds+10,i*ds+150)
                       .setSize(bs,bs);
       }
    }
}

public void sizeSlider(int bs){
   if(distanceSlider==null){
     return;
   }
   int ds = (int)distanceSlider.getValue();
   if(bs > ds){
      distanceSlider.setValue(bs);
   }    

}

public void distanceSlider(int ds){
   if(sizeSlider==null){
     return;
   }
   int bs = (int)sizeSlider.getValue();
   if(bs > ds){
      sizeSlider.setValue(ds);
   }    

}
