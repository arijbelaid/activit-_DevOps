# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  # Box Ubuntu Server
  config.vm.box = "generic/ubuntu2204"
  config.vm.hostname = "vagrant-ubuntu"

  # Adresse IP privée
  config.vm.network "private_network", ip: "192.168.56.10"
  config.vm.network "forwarded_port", guest: 3000, host: 3000
  config.vm.network "forwarded_port", guest: 5000, host: 5000
  config.vm.network "forwarded_port", guest: 5432, host: 5432  


  # Configuration des ressources
  config.vm.provider "virtualbox" do |vb|
    vb.memory = 1024
    vb.cpus = 1
  end

  # ==========================================
  # CORRECTION DNS : Force l'utilisation de Google/Cloudflare
  # ==========================================
    config.vm.provision "shell", inline: <<-SHELL
    systemctl disable systemd-resolved || true
    systemctl stop systemd-resolved || true
    rm -f /etc/resolv.conf
    echo "nameserver 8.8.8.8" > /etc/resolv.conf
    echo "nameserver 1.1.1.1" >> /etc/resolv.conf
  SHELL

  # ==========================================
  # Provisionnement Ansible (Q44)
  # ==========================================
  config.vm.provision "ansible" do |ansible|
    ansible.playbook = "ansible/playbook.yml"
    ansible.compatibility_mode = "2.0"
    ansible.extra_vars = {
      ansible_python_interpreter: "/usr/bin/python3"
    }
  end
end
