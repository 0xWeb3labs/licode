ps -ef | grep node | grep \.js | awk '{print "kill "$2 " ; "}' | sh
