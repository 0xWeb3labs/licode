ps -ef | grep node | grep erizo | awk '{print "kill "$2 " ; "}' 
ps -ef | grep node | grep erizo | awk '{print "kill "$2 " ; "}' | sh
