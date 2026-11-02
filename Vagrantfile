# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  # Box Ubuntu Server
  config.vm.box = "generic/ubuntu2204"
  config.vm.hostname = "vagrant-ubuntu"

  # Adresse IP privée
  config.vm.network "private_network", ip: "192.168.56.10"

  # Configuration des ressources
  config.vm.provider "virtualbox" do |vb|
    vb.memory = 2048
    vb.cpus = 2
  end

  # ==========================================
  # Provisionnement Ansible (Q44)
  # ==========================================
  config.vm.provision "ansible" do |ansible|
    ansible.playbook = "ansible/deploy_portfolio.yml"
    ansible.compatibility_mode = "2.0"
    ansible.extra_vars = {
      ansible_python_interpreter: "/usr/bin/python3"
    }
  end
end
