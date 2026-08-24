$cmd = "tail -100 /home/u402661558/domains/edeenapp.co.uk/laravel/storage/logs/laravel.log"
echo $cmd | ssh -p 65002 u402661558@45.130.228.181 bash -s
