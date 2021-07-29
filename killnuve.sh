ps -ef | grep node | grep nuve | awk '{print "kill "$2 " ; "}' 
ps -ef | grep node | grep nuve | awk '{print "kill "$2 " ; "}' | sh
